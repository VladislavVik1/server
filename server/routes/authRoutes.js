// ./routes/authRoutes.js
import dotenv from 'dotenv';
dotenv.config(); // ← ОБЯЗАТЕЛЬНО первым

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const { JWT_SECRET, JWT_EXPIRES_IN = '1d' } = process.env;

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email уже занят' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, role });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Логин
router.post('/login', async (req, res) => {
  console.log('💬 [Login] Body:', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('⚠️ [Login] User not found:', email);
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn('⚠️ [Login] Invalid password for:', email);
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    console.log('✅ [Login] Success for:', email);
    res.json({ token });
  } catch (err) {
    console.error('❌ [Login] Error:', err);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Пример защищённого маршрута
router.get('/profile', authenticate(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

export default router;
