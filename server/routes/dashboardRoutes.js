import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate(), getDashboardData);

export default router;
