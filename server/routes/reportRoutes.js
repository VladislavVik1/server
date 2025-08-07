import express from 'express';
import { createReport, updateStatus, getAllReports, getMyReports } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// 📌 Создание отчёта — разрешено public и admin
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

// 📌 Обновление статуса отчёта — разрешено responder и admin
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

// 📌 Получить все отчёты — только для responder и admin
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

// 📌 Получить только СВОИ отчёты — только для public
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

export default router;
