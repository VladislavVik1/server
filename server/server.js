// server/server.js
import express from 'express';
import { connectDB } from './models/index.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import testRoutes from './routes/testRoutes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:3000'
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- РЕГИСТРЫ МАРШРУТОВ ---
// Аутентификация
app.use('/api/auth', authRoutes);

// Тестовый маршрут
app.use('/api', testRoutes);

// Отчёты о преступлениях
app.use('/api', reportRoutes);

// Дашборд
app.use('/api', dashboardRoutes);

// Данные для карты
app.use('/api', mapRoutes);

// Статика React + шаблоны
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  // 1) Отдаём сам билд (js/css/html)
  app.use(express.static(buildPath));

  // 2) Отдаём шаблоны из build/templates по /templates/*
  const templatesPath = path.join(buildPath, 'templates');
  if (fs.existsSync(templatesPath)) {
    app.use('/templates', express.static(templatesPath));
  }

  // 3) Ловушка для всех остальных путей — отдаём index.html
  app.get(/.*/, (req, res) =>
    res.sendFile(path.join(buildPath, 'index.html'))
  );
}

// Подключаемся к MongoDB и стартуем сервер
connectDB(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
  app.use((err, req, res, next) => {
    console.error('💥 Uncaught error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  });
