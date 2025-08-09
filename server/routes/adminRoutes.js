import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import AuthUser from '../models/AuthUser.js';
import People from '../models/People.js';
import Spec from '../models/Spec.js';

const router = express.Router();

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v));


router.get('/responders/pending', authenticate(), authorize('admin'), async (_req, res) => {
  try {
    const specs = await Spec.find({ status: 'pending' })
      .select('user name email status createdAt')
      .lean();

    if (!specs.length) return res.json({ items: [] });

    const ids = specs.map((s) => s.user);
    const users = await AuthUser.find({ _id: { $in: ids } })
      .select('_id email role')
      .lean();

    const map = Object.fromEntries(users.map((u) => [String(u._id), u]));

    const items = specs.map((s) => ({
      userId: s.user,
      email: map[String(s.user)]?.email || s.email,
      name: s.name || '',
      status: s.status, 
      role: map[String(s.user)]?.role || 'public',
      requestedAt: s.createdAt,
    }));

    res.json({ items });
  } catch (err) {
    console.error('GET /responders/pending error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.post('/responders/:userId/approve', authenticate(), authorize('admin'), async (req, res) => {
  const { userId } = req.params;
  if (!isId(userId)) return res.status(400).json({ message: 'Invalid userId' });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const spec = await Spec.findOne({ user: userId }).session(session);
      if (!spec) return res.status(404).json({ message: 'Spec profile not found' });

      if (spec.status === 'active') {
        return res.status(409).json({ message: 'Already active' });
      }
      if (spec.status === 'suspended') {

      }

      const user = await AuthUser.findById(userId).session(session);
      if (!user) return res.status(404).json({ message: 'User not found' });

      spec.status = 'active';
      await spec.save({ session });

      user.role = 'responder';
      await user.save({ session });

      res.json({ message: 'Responder approved', userId, role: user.role, status: spec.status });
    });
  } catch (err) {
    console.error('POST /responders/:userId/approve error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    session.endSession();
  }
});


router.post('/responders/:userId/demote', authenticate(), authorize('admin'), async (req, res) => {
  const { userId } = req.params;
  if (!isId(userId)) return res.status(400).json({ message: 'Invalid userId' });


  if (String(req.user?.id) === String(userId)) {
    return res.status(400).json({ message: 'You cannot demote yourself' });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await AuthUser.findById(userId).session(session);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const spec = await Spec.findOne({ user: userId }).session(session);
      if (spec) {

        if (spec.status === 'suspended') {
          return res.status(409).json({ message: 'Already suspended', role: user.role, status: spec.status });
        }
        spec.status = 'suspended';
        await spec.save({ session });
      }

      user.role = 'public';
      await user.save({ session });

      res.json({ message: 'Responder demoted to public', userId, role: user.role, status: spec?.status || null });
    });
  } catch (err) {
    console.error('POST /responders/:userId/demote error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    session.endSession();
  }
});


router.delete('/users/:userId', authenticate(), authorize('admin'), async (req, res) => {
  const { userId } = req.params;
  if (!isId(userId)) return res.status(400).json({ message: 'Invalid userId' });


  if (String(req.user?.id) === String(userId)) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Promise.all([
        AuthUser.findByIdAndDelete(userId).session(session),
        People.findOneAndDelete({ user: userId }).session(session),
        Spec.findOneAndDelete({ user: userId }).session(session),
      ]);
      res.json({ message: 'User deleted', userId });
    });
  } catch (err) {
    console.error('DELETE /users/:userId error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    session.endSession();
  }
});

export default router;
