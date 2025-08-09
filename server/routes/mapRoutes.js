import express from 'express';
import { getMapPoints } from '../controllers/reportController.js';

const router = express.Router();


router.get('/map/points', async (req, res) => {
  try {
    const data = await getMapPoints(req);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

export default router;
