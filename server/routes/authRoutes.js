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
 * Логика Варианта 1:
 *  1) Создаём запись в AuthUser (pwd) с email как ввёл пользователь (raw).
 *  2) Создаём профиль (People/Spec) с email в нижнем регистре и привязкой user: auth._id.
 *  3) Учитываем уникальные индексы: peoples.user_1 (unique), spec.user_1 (unique), email/email_lc.
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

    const emailLC = emailRaw.toLowerCase();

    // Проверки занятости (кейс-инсенситив в pwd через email_lc, в профилях по email)
    const [existsAuth, existsPeople, existsSpec] = await Promise.all([
      AuthUser.findOne({ $or: [ { email: emailRaw }, { email_lc: emailLC } ] }).lean(),
      People.findOne({ email: emailLC }).lean(),
      Spec.findOne({ email: emailLC }).lean()
    ]);
    
    if (existsAuth || existsPeople || existsSpec) {
      return res.status(409).json({ message: 'Email уже занят' });
    }

    const hash = await bcrypt.hash(password, 10);

    // 1) Создаём AuthUser (мастер-аккаунт)
    const auth = await AuthUser.create({
      email: emailRaw,     // как ввёл пользователь
      password: hash,
      role
    });

    // 2) Создаём профиль под роль (если требуется)
    let profileDoc = null;
    if (role === 'public') {
      // Если в схеме People password обязателен — передаём hash; если нет — можно убрать поле.
      profileDoc = await People.create({
        user: auth._id,
        email: emailLC,
        role,
        password: hash
      });
    } else if (role === 'responder') {
      profileDoc = await Spec.create({
        user: auth._id,
        email: emailLC,
        role,
        password: hash
      });
    } // role === 'admin' — профиль не обязателен

    // 3) JWT
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
      profileId: profileDoc?._id || null
    });
  } catch (err) {
    // Mongo duplicate key
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email уже занят' });
    }
    console.error('auth/register error:', err);
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Ищем только в AuthUser (единая точка входа).
 */
router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email и password обязательны' });
    }

    // В AuthUser email хранится как raw; индекс уникальности должен быть на email_lc
    const auth = await AuthUser.findOne({ email: emailRaw });
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
      phone: profile?.phone,           // поле из People (если есть)
      department: profile?.department, // поле из Spec (если есть)
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt
    });
  } catch (err) {
    console.error('auth/profile error:', err);
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

export default router;
