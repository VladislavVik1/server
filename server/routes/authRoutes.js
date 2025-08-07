// ./routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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
    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Пример защищённого маршрута
router.get('/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

export default router;
