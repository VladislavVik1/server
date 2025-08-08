import express from 'express';
import { getMapPoints } from '../controllers/reportController.js';

const router = express.Router();

// 📌 Точки для карты — публично
router.get('/map/points', async (req, res) => {
  try {
    const data = await getMapPoints(req);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

export default router;
