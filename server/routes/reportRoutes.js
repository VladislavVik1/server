
import express from 'express';
import { createReport, updateStatus } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/reports',
  authenticate(['public']),
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

router.put(
  '/reports/:id/status',
  authenticate(['responder']),
  async (req, res) => {
    try {
      const updated = await updateStatus(req);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

export default router;
