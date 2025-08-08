// server/routes/reportRoutes.js
import express from 'express';
import {
  createReport,
  updateStatus,
  getAllReports,
  getReportById,
  getMyReports,
  listForModeration,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Создание отчёта — public и admin
router.post(
  '/reports',
  authenticate(['public', 'admin']),
  upload.single('image'),
  async (req, res) => {
    try {
      const report = await createReport(req);
      res.status(201).json(report);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

// Обновление статуса — responder и admin
router.put(
  '/reports/:id/status',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    try {
      const updated = await updateStatus(req);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

// Все отчёты — responder и admin
router.get(
  '/reports',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    try {
      const reports = await getAllReports();
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

// Только свои — public
router.get(
  '/reports/mine',
  authenticate(['public']),
  async (req, res) => {
    try {
      const reports = await getMyReports(req.user.id);
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

// 🔹 Листинг для модератора (ПЕРЕД :id!)
router.get(
  '/reports/moderation',
  authenticate(['responder', 'admin']),
  listForModeration
);

// Алиас на pending
router.get(
  '/reports/pending',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    req.query.status = 'pending';
    return listForModeration(req, res);
  }
);

// Один отчёт по ID — все роли
router.get(
  '/reports/:id',
  authenticate(['public', 'responder', 'admin']),
  async (req, res) => {
    try {
      await getReportById(req, res); // контроллер сам шлёт res
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

export default router;
