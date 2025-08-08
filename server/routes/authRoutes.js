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

// утилита для безопасного кейс-инсенситив поиска по email
const escapeRegExp = (s='') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * POST /api/auth/register
 * Body: { email, password, role: 'public'|'responder' }
 * — сохраняем email в ТОМ регистре, что прислал пользователь;
 * — проверяем занятость email без учёта регистра.
 */
router.post('/register', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim(); // 👈 НЕ .toLowerCase()
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();

    if (!emailRaw || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    const Model = role === 'public' ? People : Spec;

    // кейс-инсенситив проверка занятости
    const emailRE = new RegExp(`^${escapeRegExp(emailRaw)}$`, 'i');
    const exists = await Model.findOne({ email: emailRE });
    if (exists) return res.status(400).json({ message: 'Email уже занят' });

    const hash = await bcrypt.hash(password, 10);
    const user = await Model.create({ email: emailRaw, password: hash, role });

    // сразу возвращаем токен (удобно фронту)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.status(201).json({
      message: role === 'public' ? 'Пользователь создан' : 'Респондент создан',
      id: user._id,
      token,
      role: user.role,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'Email уже занят' });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Некорректные данные', details: err.errors });
    }
    console.error('auth/register error:', err);
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password [, role] }
 * — ищем пользователя по всем коллекциям без учёта регистра;
 * — в токен кладём фактическую роль и email в исходном регистре из БД.
 */
router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim(); // 👈 НЕ .toLowerCase()
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email и password обязательны' });
    }

    const emailRE = new RegExp(`^${escapeRegExp(emailRaw)}$`, 'i');

    // порядок: admin -> public -> responder
    let user = await AuthUser.findOne({ email: emailRE });
    let role = user ? 'admin' : null;

    if (!user) {
      user = await People.findOne({ email: emailRE });
      role = user ? 'public' : role;
    }
    if (!user) {
      user = await Spec.findOne({ email: emailRE });
      role = user ? 'responder' : role;
    }

    if (!user || !role) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token, role });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ message: 'Ошибка входа', error: err.message });
  }
});

/**
 * GET /api/auth/profile
 */
router.get('/profile', authenticate(), async (req, res) => {
  try {
    const { id, role } = req.user;

    let profile = null;
    if (role === 'admin') {
      profile = await AuthUser.findById(id).select('-password');
    } else if (role === 'public') {
      profile = await People.findById(id).select('-password');
    } else if (role === 'responder') {
      profile = await Spec.findById(id).select('-password');
    }

    if (!profile) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }

    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

export default router;
