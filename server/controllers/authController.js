import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthUser from '../models/AuthUser.js';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

const { JWT_SECRET = 'dev_secret', JWT_EXPIRES_IN = '1d' } = process.env;

export const register = async (req, res) => {
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

    const existsAuth = await AuthUser.findOne({ email: emailRaw });
    const existsPeople = await People.findOne({ email: emailLC });
    const existsSpec = await Spec.findOne({ email: emailLC });
    if (existsAuth || existsPeople || existsSpec) {
      return res.status(409).json({ message: 'Email уже занят' });
    }

    const hash = await bcrypt.hash(password, 10);

    const auth = await AuthUser.create({
      email: emailRaw,
      password: hash,
      role
    });

    let profileDoc = null;
    if (role === 'public') {
      profileDoc = await People.create({
        user: auth._id,
        email: emailLC,
        role,
        password: hash // убери, если пароль в People не нужен
      });
    } else if (role === 'responder') {
      profileDoc = await Spec.create({
        user: auth._id,
        email: emailLC,
        role,
        password: hash // убери, если пароль в Spec не нужен
      });
    }

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({ token, role: auth.role, userId: auth._id, profileId: profileDoc?._id || null });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email уже занят' });
    }
    return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    const auth = await AuthUser.findOne({ email: emailRaw });
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
      avatar: profile?.avatar || '',
      phone: profile?.phone,
      department: profile?.department,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt
    });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};
