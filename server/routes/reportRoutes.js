
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


router.post(
  '/reports',
  authenticate(['public', 'admin']),
  upload.single('image'),
  async (req, res) => {
    try {
      const report = await createReport(req);
      res.status(201).json(report);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
);


router.put(
  '/reports/:id/status',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    try {
      const updated = await updateStatus(req);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
);


router.get(
  '/reports',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    try {
      const reports = await getAllReports();
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
);


router.get(
  '/reports/mine',
  authenticate(['public']),
  async (req, res) => {
    try {
      const reports = await getMyReports(req.user.id);
      res.json(reports);
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
);


router.get(
  '/reports/moderation',
  authenticate(['responder', 'admin']),
  listForModeration
);


router.get(
  '/reports/pending',
  authenticate(['responder', 'admin']),
  async (req, res) => {
    req.query.status = 'pending';
    return listForModeration(req, res);
  }
);


router.get(
  '/reports/:id',
  authenticate(['public', 'responder', 'admin']),
  async (req, res) => {
    try {
      await getReportById(req, res); //
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  }
);

export default router;
