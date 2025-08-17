// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AuthUser from '../models/AuthUser.js';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

const { JWT_SECRET = 'dev_secret', JWT_EXPIRES_IN = '1d' } = process.env;

export const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const emailLC = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();

    if (!emailLC || !password || !role) {
      return res.status(400).json({ message: 'email, password, role are required' });
    }
    if (!['public', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Wrong role' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password too short (min 6)' });
    }

    // Чекаем только в AuthUser
    const existsAuth = await AuthUser.findOne({ email: emailLC }).session(session);
    if (existsAuth) {
      return res.status(409).json({ message: 'Email already used' });
    }

    const hash = await bcrypt.hash(password, 10);

    const auth = await AuthUser.create([{
      email: emailLC,
      password: hash,
      role
    }], { session }).then(docs => docs[0]);

    let profileDoc = null;
    if (role === 'public') {
      profileDoc = await People.create([{
        user: auth._id,
        email: emailLC,
        role
      }], { session }).then(docs => docs[0]);
    } else if (role === 'responder') {
      profileDoc = await Spec.create([{
        user: auth._id,
        email: emailLC,
        role
      }], { session }).then(docs => docs[0]);
    }

    await session.commitTransaction();
    session.endSession();

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      token,
      role: auth.role,
      userId: auth._id,
      profileId: profileDoc?._id || null
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Конфликт уникального индекса AuthUser.email
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Email already used' });
    }
    return res.status(500).json({ message: 'Register Error', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const emailLC = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const auth = await AuthUser.findOne({ email: emailLC });
    if (!auth) return res.status(401).json({ message: 'Wrong user data' });

    const ok = await bcrypt.compare(password, auth.password);
    if (!ok) return res.status(401).json({ message: 'Wrong user data' });

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return res.json({ token, role: auth.role });
  } catch (err) {
    return res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
