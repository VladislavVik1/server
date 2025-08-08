// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthUser from '../models/AuthUser.js';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

const { JWT_SECRET = 'dev_secret', JWT_EXPIRES_IN = '1d' } = process.env;

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password и role обязательны' });
    }
    if (!['public', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    const exists = await AuthUser.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email уже занят' });

    const hash = await bcrypt.hash(password, 10);
    const auth = await AuthUser.create({ email, password: hash, role });

    // Создаём профиль под роль
    if (role === 'public') {
      await People.create({ user: auth._id, email });
    } else if (role === 'responder') {
      await Spec.create({ user: auth._id, email });
    } else {
      // admin — профиль опционален, можно завести отдельную коллекцию, если надо
    }

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({ token, role: auth.role });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const auth = await AuthUser.findOne({ email });
    if (!auth) return res.status(401).json({ message: 'Неверные учетные данные' });

    const ok = await bcrypt.compare(password, auth.password);
    if (!ok) return res.status(401).json({ message: 'Неверные учетные данные' });

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return res.json({ token, role: auth.role });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    // req.user приходит из authenticate() — { id, email, role }
    const { id, role } = req.user;

    const auth = await AuthUser.findById(id).select('-password');
    if (!auth) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (role === 'public') {
      profile = await People.findOne({ user: id });
    } else if (role === 'responder') {
      profile = await Spec.findOne({ user: id });
    }

    // Склеиваем базовые поля + профиль по роли
    return res.json({
      id: auth._id,
      email: auth.email,
      role: auth.role,
      profileId: profile?._id || null,
      name: profile?.name || '',
      avatar: profile?.avatar || '',
      phone: profile?.phone,         // только в People (может быть undefined)
      department: profile?.department, // только в Spec (может быть undefined)
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};
