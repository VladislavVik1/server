// routes/authRoutes.js
import dotenv from 'dotenv';
dotenv.config(); // обязательно первым

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import AuthUser from '../models/AuthUser.js'; // коллекция: pwd (admin)
import People from '../models/People.js';     // коллекция: peoples (public)
import Spec from '../models/Spec.js';         // коллекция: spec (responder)

import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const { JWT_SECRET = 'dev_secret', JWT_EXPIRATION = '1d' } = process.env;

/**
 * POST /api/auth/register
 * Body: { email, password, role: 'public'|'responder' }
 * admin не регистрируется отсюда — создаётся вручную
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    // Проверка по нужной коллекции
    const exists =
      role === 'public'
        ? await People.findOne({ email })
        : await Spec.findOne({ email });

    if (exists) return res.status(400).json({ message: 'Email уже занят' });

    const hash = await bcrypt.hash(password, 10);

    if (role === 'public') {
      const user = await People.create({ email, password: hash, role });
      return res.status(201).json({ message: 'Пользователь создан', id: user._id });
    } else {
      const user = await Spec.create({ email, password: hash, role });
      return res.status(201).json({ message: 'Респондент создан', id: user._id });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password, role }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    let user = null;

    if (role === 'admin') {
      user = await AuthUser.findOne({ email }); // коллекция pwd
    } else if (role === 'public') {
      user = await People.findOne({ email }); // коллекция peoples
    } else if (role === 'responder') {
      user = await Spec.findOne({ email }); // коллекция spec
    }

    if (!user) return res.status(401).json({ message: 'Неверные учетные данные' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Неверные учетные данные' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token, role: user.role });
  } catch (err) {
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
