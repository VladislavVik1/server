// ./routes/mapRoutes.js
import express from 'express';
import { getMapData } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Доступ к данным карты только для аутентифицированных пользователей
router.get(
  '/map-data',
  authenticate(),
  async (req, res) => {
    try {
      const data = await getMapData();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
  }
);

export default router;
