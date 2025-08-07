// routes/dashboardRoutes.js
import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get(
  '/dashboard',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    try {
      const data = await getDashboardData(req.user);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

export default router;
