import dotenv from 'dotenv';
dotenv.config(); // загружаем .env самым первым

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import AuthUser from '../models/AuthUser.js'; // admin (pwd)
import People from '../models/People.js';     // public (peoples)
import Spec from '../models/Spec.js';         // responder (spec)

import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const { JWT_SECRET = 'dev_secret', JWT_EXPIRATION = '1d' } = process.env;

/**
 * POST /api/auth/register
 * Body: { email, password, role: 'public' | 'responder' | 'admin' }
 * Логика:
 *  1) Создаём запись в AuthUser (pwd) с email как ввёл пользователь (raw).
 *  2) Создаём профиль (People/Spec) с email в нижнем регистре и привязкой user: auth._id.
 *  3) Проверка email кейс-инсенситивно (pwd: email/email_lc; профили: email LC).
 */
router.post('/register', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();

    // ЛОГ (временный)
    console.log('[REGISTER] body =', req.body);

    if (!emailRaw || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    const emailLC = emailRaw.toLowerCase();

    // Ищем во всех трёх местах
    const [existsAuth, existsPeople, existsSpec] = await Promise.all([
      AuthUser.findOne({ $or: [ { email: emailRaw }, { email_lc: emailLC } ] }),
      People.findOne({ $or: [ { email: emailLC }, { email_lc: emailLC } ] }).lean(),
      Spec.findOne({ $or: [ { email: emailLC }, { email_lc: emailLC } ] }).lean()
    ]);

    console.log('[REGISTER] exists:', {
      pwd: !!existsAuth,
      peoples: !!existsPeople,
      spec: !!existsSpec,
      emailRaw,
      emailLC
    });

    // === ВЕТКА 1: учётка уже есть в pwd ===
    if (existsAuth) {
      // 1) Если профиль под роль уже существует — конфликт
      if ((role === 'public' && existsPeople) || (role === 'responder' && existsSpec)) {
        return res.status(409).json({ message: 'Email уже занят' });
      }

      // 2) Проверяем пароль от существующей учётки
      const ok = await bcrypt.compare(password, existsAuth.password);
      if (!ok) {
        // Не даём привязать профиль к чужой учётке
        return res.status(409).json({ message: 'Email уже занят' });
      }

      // 3) Дозаводим недостающий профиль к существующей учётке
      try {
        let profileDoc = null;
        if (role === 'public' && !existsPeople) {
          profileDoc = await People.create({
            user: existsAuth._id,
            email: emailLC,
            email_lc: emailLC,
            role,
            password: existsAuth.password // тот же хэш
          });
          console.log('[REGISTER] People created for existing AuthUser', profileDoc?._id?.toString());
        } else if (role === 'responder' && !existsSpec) {
          profileDoc = await Spec.create({
            user: existsAuth._id,
            email: emailLC,
            email_lc: emailLC,
            role,
            password: existsAuth.password
          });
          console.log('[REGISTER] Spec created for existing AuthUser', profileDoc?._id?.toString());
        } else if (role === 'admin') {
          // для admin профиль не создаём
        }

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
          profileId: profileDoc?._id || null
        });
      } catch (e) {
        console.error('[REGISTER] create profile for existing AuthUser error:', e?.code, e?.message, e?.keyValue);
        if (e?.code === 11000) {
          return res.status(409).json({ message: 'Email уже занят' });
        }
        throw e;
      }
    }

    // === ВЕТКА 2: учётки ещё нет — создаём с нуля ===
    // Проверка на профили (на всякий)
    if (existsPeople || existsSpec) {
      return res.status(409).json({ message: 'Email уже занят' });
    }

    const hash = await bcrypt.hash(password, 10);

    // 1) AuthUser
    let auth;
    try {
      auth = await AuthUser.create({
        email: emailRaw,
        email_lc: emailLC,
        password: hash,
        role
      });
      console.log('[REGISTER] AuthUser created', auth?._id?.toString());
    } catch (e) {
      console.error('[REGISTER] AuthUser.create error:', e?.code, e?.message, e?.keyValue);
      if (e?.code === 11000) {
        return res.status(409).json({ message: 'Email уже занят' });
      }
      throw e;
    }

    // 2) Профиль
    let profileDoc = null;
    if (role === 'public') {
      try {
        profileDoc = await People.create({
          user: auth._id,
          email: emailLC,
          email_lc: emailLC,
          role,
          password: hash
        });
        console.log('[REGISTER] People created', profileDoc?._id?.toString());
      } catch (e) {
        console.error('[REGISTER] People.create error:', e?.code, e?.message, e?.keyValue);
        if (e?.code === 11000) {
          return res.status(409).json({ message: 'Email уже занят' });
        }
        throw e;
      }
    } else if (role === 'responder') {
      try {
        profileDoc = await Spec.create({
          user: auth._id,
          email: emailLC,
          email_lc: emailLC,
          role,
          password: hash
        });
        console.log('[REGISTER] Spec created', profileDoc?._id?.toString());
      } catch (e) {
        console.error('[REGISTER] Spec.create error:', e?.code, e?.message, e?.keyValue);
        if (e?.code === 11000) {
          return res.status(409).json({ message: 'Email уже занят' });
        }
        throw e;
      }
    }

    // 3) JWT
    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    console.log('[REGISTER] SUCCESS ->', { userId: auth._id.toString(), profileId: profileDoc?._id?.toString() || null });

    return res.status(201).json({
      message: 'Регистрация успешна',
      token,
      role: auth.role,
      userId: auth._id,
      profileId: profileDoc?._id || null
    });
  } catch (err) {
    console.error('[REGISTER] Uncaught error:', err?.code, err?.message, err?.stack);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email уже занят' });
    }
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Ищем в AuthUser кейс-инсенситивно (email/email_lc).
 */
router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email и password обязательны' });
    }

    const auth = await AuthUser.findOne({
      $or: [
        { email: emailRaw },
        { email_lc: emailRaw.toLowerCase() }
      ]
    });

    if (!auth) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const ok = await bcrypt.compare(password, auth.password);
    if (!ok) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

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
 * Берём профиль по роли из токена.
 */
router.get('/profile', authenticate(), async (req, res) => {
  try {
    const { id, role } = req.user;

    // Базовая учётка
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
      avatar: profile?.avatar || '',
      phone: profile?.phone,
      department: profile?.department,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt
    });
  } catch (err) {
    console.error('auth/profile error:', err);
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

export default router;
