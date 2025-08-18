import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import AuthUser from '../models/AuthUser.js';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const { JWT_SECRET = 'dev_secret', JWT_EXPIRATION = '1d', NODE_ENV } = process.env;

// безопасное объявление модели для старой коллекции `pwd`
const PwdUser =
  mongoose.models.PwdUser ||
  mongoose.model('PwdUser', new mongoose.Schema({}, { strict: false }), 'pwd');

const isBcrypt = (s) => typeof s === 'string' && /^\$2[aby]\$/.test(s);
const profileModelByRole = (role) => (role === 'responder' ? Spec : People);

/* ===================== REGISTER ===================== */
router.post('/register', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const requestedRole = String(req.body.role || '').trim();

    if (!emailRaw || !password || !requestedRole) {
      return res.status(400).json({ message: 'email, password , role оare required' });
    }
    if (!['public', 'responder', 'admin'].includes(requestedRole)) {
      return res.status(400).json({ message: 'Wrong role' });
    }

    const authRole = requestedRole === 'responder' ? 'public' : requestedRole;
    const emailLC = emailRaw.toLowerCase();

    const [existsAuth, existsPeople, existsSpec] = await Promise.all([
      // Ищем только по полю email
      AuthUser.findOne({ $or: [{ email: emailRaw }, { email: emailLC }] }),
      People.findOne({ $or: [{ email: emailRaw }, { email: emailLC }] }).lean(),
      Spec.findOne({ $or: [{ email: emailRaw }, { email: emailLC }] }).lean(),
    ]);

    if (existsAuth) {
      if ((requestedRole === 'public' && existsPeople) ||
          (requestedRole === 'responder' && existsSpec)) {
        return res.status(409).json({ message: 'Email alredy used' });
      }

      const ok = await bcrypt.compare(password, existsAuth.password);
      if (!ok) return res.status(409).json({ message: 'Email alredy used' });

      let profileDoc = null;
      if (requestedRole === 'public' && !existsPeople) {
        profileDoc = await People.create({
          user: existsAuth._id,
          email: emailLC,
          role: 'public',
          password: existsAuth.password,
        });
      } else if (requestedRole === 'responder' && !existsSpec) {
        profileDoc = await Spec.create({
          user: existsAuth._id,
          email: emailLC,
          role: 'responder',
          password: existsAuth.password,
          status: 'pending',
        });
      }

      const token = jwt.sign(
        { id: existsAuth._id, email: existsAuth.email, role: existsAuth.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      return res.status(201).json({
        message: requestedRole === 'responder'
          ? 'Profile is create. Wait approved from admin.'
          : 'Profile add successfully',
        token,
        role: existsAuth.role,
        userId: existsAuth._id,
        profileId: profileDoc?._id || null,
      });
    }

    if (existsPeople || existsSpec) {
      return res.status(409).json({ message: 'Email уже занят' });
    }

    const hash = await bcrypt.hash(password, 10);

    // Храним пароли только в authusers; email всегда нижним регистром
    const auth = await AuthUser.create({
      email: emailLC,
      password: hash,
      role: authRole,
    });

    const peopleDoc = await People.create({
      user: auth._id,
      email: emailLC,
      role: 'public',
      password: hash,
    });

    let specDoc = null;
    if (requestedRole === 'responder') {
      specDoc = await Spec.create({
        user: auth._id,
        email: emailLC,
        role: 'responder',
        password: hash,
        status: 'pending',
      });
    }

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.status(201).json({
      message: requestedRole === 'responder'
        ? 'Profile is create. Wait approved from admin.'
        : 'Profile add successfully',
      token,
      role: auth.role,
      userId: auth._id,
      profileId: requestedRole === 'responder' ? (specDoc?._id || null) : (peopleDoc?._id || null),
    });
  } catch (err) {
    if (!NODE_ENV || NODE_ENV === 'development') {
      console.error('[REGISTER] error:', err);
    }
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email already used' });
    }
    return res.status(500).json({ message: 'Error register', error: err.message });
  }
});
/* ==================================================== */


/* ============== LOGIN (с миграцией из `pwd`) ============== */
router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const emailLC = emailRaw.toLowerCase();

    // 1) новая коллекция authusers
    let user = await AuthUser.findOne({
      $or: [{ email: emailRaw }, { email: emailLC }]
    });

    // 2) если не нашли — старая коллекция pwd
    if (!user) {
      const legacy = await PwdUser.findOne({
        $or: [
          { email: emailRaw }, { email: emailLC },
          { login: emailRaw }, { login: emailLC }
        ]
      });

      if (!legacy) return res.status(401).json({ message: 'Wrong data' });

      const legacyPass = String(legacy.password || legacy.pass || legacy.pwd || '');
      const passOk = isBcrypt(legacyPass)
        ? await bcrypt.compare(password, legacyPass)
        : legacyPass === password;

      if (!passOk) return res.status(401).json({ message: 'Wrong data' });

      // MIGRATION → сохраняем/обновляем в authusers
      const normalizedEmail =
        (legacy.email && String(legacy.email)) ||
        (legacy.login && String(legacy.login)) ||
        emailRaw;

      const emailNormLC = normalizedEmail.toLowerCase();
      const hashed = isBcrypt(legacyPass) ? legacyPass : await bcrypt.hash(password, 10);
      const role =
        (legacy.role && String(legacy.role)) ||
        (legacy.isAdmin ? 'admin' : 'user') ||
        'user';

      user = await AuthUser.findOneAndUpdate(
        { email: emailNormLC },
        {
          $set: {
            email: emailNormLC,
            password: hashed,
            role
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      // обычная проверка пароля
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ message: 'Wrong data' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token, role: user.role });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ message: 'Error enter', error: err.message });
  }
});
/* ========================================================== */


/* ===================== PROFILE GET ===================== */
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
    return res.status(500).json({ message: 'Server Error', error: err.message });
  }
});
/* ====================================================== */


/* ===================== PROFILE PUT ==================== */
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
    return res.status(500).json({ message: 'Error Save Profile', error: err.message });
  }
});
/* ====================================================== */


/* ===================== AVATAR UPLOAD ================== */
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
    return res.status(500).json({ message: 'Error Download', error: err.message });
  }
});
/* ====================================================== */


/* ===================== PASSWORD CHANGE ================ */
router.post('/password', authenticate(), async (req, res) => {
  try {
    const { id } = req.user;
    const { current, next } = req.body || {};

    if (!current || !next) {
      return res.status(400).json({ message: 'current and next are required' });
    }

    const user = await AuthUser.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(String(current), user.password);
    if (!ok) return res.status(400).json({ message: 'Wrong password' });

    user.password = await bcrypt.hash(String(next), 10);
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('POST /auth/password error', err);
    return res.status(500).json({ message: 'Error Change Password', error: err.message });
  }
});
/* ====================================================== */

export default router;
