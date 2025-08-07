// ./routes/testRoutes.js
import express from 'express';
const router = express.Router();

// Тестовый маршрут без авторизации
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Backend is working!' });
});

export default router;
