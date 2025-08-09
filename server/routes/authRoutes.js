import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import AuthUser from '../models/AuthUser.js';  // admin (pwd)
import People from '../models/People.js';      // public (peoples)
import Spec from '../models/Spec.js';          // responder (spec)

import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const { JWT_SECRET = 'dev_secret', JWT_EXPIRATION = '1d', NODE_ENV } = process.env;

// helper: выбрать модель профиля по роли
const profileModelByRole = (role) => (role === 'responder' ? Spec : People);

/**
 * POST /api/auth/register
 * Body: { email, password, role: 'public' | 'responder' | 'admin' }
 */
router.post('/register', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();

    if (!emailRaw || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    // TODO (опционально): ограничить создание admin
    // if (role === 'admin' && req.headers['x-admin-token'] !== process.env.ADMIN_REG_TOKEN) {
    //   return res.status(403).json({ message: 'Недостаточно прав на создание admin' });
    // }

    const emailLC = emailRaw.toLowerCase();

    // Проверки наличия
    const [existsAuth, existsPeople, existsSpec] = await Promise.all([
      AuthUser.findOne({ $or: [{ email: emailRaw }, { email_lc: emailLC }] }),
      People.findOne({ $or: [{ email: emailLC }, { email_lc: emailLC }] }).lean(),
      Spec.findOne({ $or: [{ email: emailLC }, { email_lc: emailLC }] }).lean(),
    ]);

    // === Случай 1: учётка уже есть в AuthUser
    if (existsAuth) {
      // Профиль на ту же роль уже есть — конфликт
      if ((role === 'public' && existsPeople) || (role === 'responder' && existsSpec)) {
        return res.status(409).json({ message: 'Email уже занят' });
      }

      // Проверяем пароль — иначе нельзя “привязать” профиль к чужой учётке
      const ok = await bcrypt.compare(password, existsAuth.password);
      if (!ok) return res.status(409).json({ message: 'Email уже занят' });

      // Дозаводим недостающий профиль к существующей учётке
      let profileDoc = null;
      if (role === 'public' && !existsPeople) {
        profileDoc = await People.create({
          user: existsAuth._id,
          email: emailLC,
          email_lc: emailLC,
          role,
          password: existsAuth.password, // хэш
        });
      } else if (role === 'responder' && !existsSpec) {
        profileDoc = await Spec.create({
          user: existsAuth._id,
          email: emailLC,
          email_lc: emailLC,
          role,
          password: existsAuth.password,
        });
      } // admin — без профиля

      const token = jwt.sign(
        { id: existsAuth._id, email: existsAuth.email, role: existsAuth.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      return res.status(201).json({
        message: 'Профиль добавлен к существующей учётке',
        token,
        role: existsAuth.role,
        userId: existsAuth._id,
        profileId: profileDoc?._id || null,
      });
    }

    // === Случай 2: создаём с нуля
    if (existsPeople || existsSpec) {
      return res.status(409).json({ message: 'Email уже занят' });
    }

    const hash = await bcrypt.hash(password, 10);

    const auth = await AuthUser.create({
      email: emailRaw,
      email_lc: emailLC,
      password: hash,
      role,
    });

    let profileDoc = null;
    if (role === 'public') {
      profileDoc = await People.create({
        user: auth._id,
        email: emailLC,
        email_lc: emailLC,
        role,
        password: hash,
      });
    } else if (role === 'responder') {
      profileDoc = await Spec.create({
        user: auth._id,
        email: emailLC,
        email_lc: emailLC,
        role,
        password: hash,
      });
    }

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.status(201).json({
      message: 'Регистрация успешна',
      token,
      role: auth.role,
      userId: auth._id,
      profileId: profileDoc?._id || null,
    });
  } catch (err) {
    if (!NODE_ENV || NODE_ENV === 'development') {
      console.error('[REGISTER] error:', err);
    }
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email уже занят' });
    }
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email и password обязательны' });
    }

    const auth = await AuthUser.findOne({
      $or: [{ email: emailRaw }, { email_lc: emailRaw.toLowerCase() }],
    });

    if (!auth) return res.status(401).json({ message: 'Неверные учетные данные' });

    const ok = await bcrypt.compare(password, auth.password);
    if (!ok) return res.status(401).json({ message: 'Неверные учетные данные' });

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token, role: auth.role });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ message: 'Ошибка входа', error: err.message });
  }
});

/**
 * GET /api/auth/profile
 * Отдаём профиль и настройки по роли из токена.
 */
router.get('/profile', authenticate(), async (req, res) => {
  try {
    const { id, role } = req.user;

    const auth = await AuthUser.findById(id).select('-password');
    if (!auth) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (role === 'public') {
      profile = await People.findOne({ user: id }).select('-password');
    } else if (role === 'responder') {
      profile = await Spec.findOne({ user: id }).select('-password');
    }

    return res.json({
      id: auth._id,
      email: auth.email,
      role: auth.role,
      profileId: profile?._id || null,
      name: profile?.name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      avatarUrl: profile?.avatarUrl || '',
      theme: profile?.theme || 'light',
      language: profile?.language || 'en',
      notifications: typeof profile?.notifications === 'boolean' ? profile.notifications : true,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    });
  } catch (err) {
    console.error('auth/profile error:', err);
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

/**
 * PUT /api/auth/profile
 * Body: { name, phone, location, theme, language, notifications }
 */
router.put('/profile', authenticate(), async (req, res) => {
  try {
    const { id, role } = req.user;
    const Model = profileModelByRole(role);

    const update = {
      name: String(req.body.name || '').trim(),
      phone: String(req.body.phone || '').trim(),
      location: String(req.body.location || '').trim(),
      theme: req.body.theme === 'dark' ? 'dark' : 'light',
      language: String(req.body.language || 'en').trim(),
      notifications: typeof req.body.notifications === 'boolean' ? req.body.notifications : true,
    };

    const profile = await Model.findOneAndUpdate(
      { user: id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select('-password');

    return res.json({
      message: 'Profile updated',
      profile: {
        name: profile.name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        avatarUrl: profile.avatarUrl || '',
        theme: profile.theme,
        language: profile.language,
        notifications: profile.notifications,
      },
    });
  } catch (err) {
    console.error('PUT /auth/profile error', err);
    return res.status(500).json({ message: 'Ошибка сохранения профиля', error: err.message });
  }
});

/**
 * POST /api/auth/avatar
 * multipart/form-data, field: avatar
 */
router.post('/avatar', authenticate(), upload.single('avatar'), async (req, res) => {
  try {
    const { id, role } = req.user;
    const Model = profileModelByRole(role);

    if (!req.file) return res.status(400).json({ message: 'No file' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    await Model.findOneAndUpdate(
      { user: id },
      { $set: { avatarUrl } },
      { upsert: true }
    );

    return res.json({ message: 'Avatar updated', avatarUrl });
  } catch (err) {
    console.error('POST /auth/avatar error', err);
    return res.status(500).json({ message: 'Ошибка загрузки', error: err.message });
  }
});

/**
 * POST /api/auth/password
 * Body: { current, next }
 */
router.post('/password', authenticate(), async (req, res) => {
  try {
    const { id } = req.user;
    const { current, next } = req.body || {};

    if (!current || !next) {
      return res.status(400).json({ message: 'current и next обязательны' });
    }

    const user = await AuthUser.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(String(current), user.password);
    if (!ok) return res.status(400).json({ message: 'Неверный текущий пароль' });

    user.password = await bcrypt.hash(String(next), 10);
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('POST /auth/password error', err);
    return res.status(500).json({ message: 'Ошибка смены пароля', error: err.message });
  }
});

export default router;
