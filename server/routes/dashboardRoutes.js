
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();


router.get('/dashboard/summary', authenticate(['public','responder','admin']), getDashboardSummary);

export default router;
