// server/routes/publicMapRoutes.js
import express from 'express';
import CrimeReport from '../models/CrimeReport.js';

const router = express.Router();

/**
 * Публичный эндпоинт для лендинга.
 * Отдаёт ВСЕ approved-репорты с координатами (lat/lng).
 * Авторизация НЕ требуется.
 */
router.get('/landing/reports', async (_req, res) => {
  try {
    const docs = await CrimeReport.find(
      {
        status: 'approved',
        'location.coordinates.lat': { $exists: true, $ne: null, $type: 'number' },
        'location.coordinates.lng': { $exists: true, $ne: null, $type: 'number' },
      },
      {
        type: 1,
        description: 1,
        comments: 1,
        location: 1,
        date: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    // отключаем кэш, чтобы новые модерации сразу были видны
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(docs);
  } catch (err) {
    console.error('Landing reports error:', err);
    res.status(500).json({
      message: 'Failed to load landing reports',
      error: err.message,
    });
  }
});

export default router;
