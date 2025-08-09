import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import AuthUser from '../models/AuthUser.js';  
import People from '../models/People.js';      
import Spec from '../models/Spec.js';          

import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
const { JWT_SECRET = 'dev_secret', JWT_EXPIRATION = '1d', NODE_ENV } = process.env;


const profileModelByRole = (role) => (role === 'responder' ? Spec : People);


router.post('/register', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const requestedRole = String(req.body.role || '').trim(); // 

    if (!emailRaw || !password || !requestedRole) {
      return res.status(400).json({ message: 'email, password , role оare required' });
    }
    if (!['public', 'responder', 'admin'].includes(requestedRole)) {
      return res.status(400).json({ message: 'Wrong role' });
    }

    const authRole = requestedRole === 'responder' ? 'public' : requestedRole;
    const specStatus = requestedRole === 'responder' ? 'pending' : undefined;

    const emailLC = emailRaw.toLowerCase();

 
    const [existsAuth, existsPeople, existsSpec] = await Promise.all([
      AuthUser.findOne({ $or: [{ email: emailRaw }, { email_lc: emailLC }] }),
      People.findOne({ $or: [{ email: emailLC }, { email_lc: emailLC }] }).lean(),
      Spec.findOne({ $or: [{ email: emailLC }, { email_lc: emailLC }] }).lean(),
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
          email_lc: emailLC,
          role: 'public',
          password: existsAuth.password,
        });
      } else if (requestedRole === 'responder' && !existsSpec) {
        profileDoc = await Spec.create({
          user: existsAuth._id,
          email: emailLC,
          email_lc: emailLC,
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

    const auth = await AuthUser.create({
      email: emailRaw,
      email_lc: emailLC,
      password: hash,
      role: authRole, 
    });


    const peopleDoc = await People.create({
      user: auth._id,
      email: emailLC,
      email_lc: emailLC,
      role: 'public',
      password: hash,
    });

    let specDoc = null;
    if (requestedRole === 'responder') {
      specDoc = await Spec.create({
        user: auth._id,
        email: emailLC,
        email_lc: emailLC,
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

router.post('/login', async (req, res) => {
  try {
    const emailRaw = String(req.body.email || '').trim();
    const password = String(req.body.password || '');

    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const auth = await AuthUser.findOne({
      $or: [{ email: emailRaw }, { email_lc: emailRaw.toLowerCase() }],
    });

    if (!auth) return res.status(401).json({ message: 'Wrong data' });

    const ok = await bcrypt.compare(password, auth.password);
    if (!ok) return res.status(401).json({ message: 'Wrong data' });

    const token = jwt.sign(
      { id: auth._id, email: auth.email, role: auth.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return res.json({ token, role: auth.role });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ message: 'Error enter', error: err.message });
  }
});


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

export default router;
