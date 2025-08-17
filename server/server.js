import express from 'express';
import { connectDB } from './models/index.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import mapRoutes from './routes/mapRoutes.js';
import testRoutes from './routes/testRoutes.js';
import publicMapRoutes from './routes/publicMapRoutes.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

/* ------------------- CORS ------------------- */
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const allowedOrigin = (process.env.CLIENT_URL || '').trim();

  app.use(cors({
    origin: allowedOrigin, // например "https://crimebook.app"
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
} else {
  // Dev / test — открыть для всех, без credentials
  app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
}

// preflight (Express 5: нельзя '*', используем регэксп)
app.options(/.*/, cors());
/* -------------------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api', testRoutes);
app.use('/api', reportRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', mapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicMapRoutes);

const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  const templatesPath = path.join(buildPath, 'templates');
  if (fs.existsSync(templatesPath)) {
    app.use('/templates', express.static(templatesPath));
  }
  app.get(/.*/, (req, res) =>
    res.sendFile(path.join(buildPath, 'index.html'))
  );
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (uri) {
  connectDB(uri)
    .then(() => {
      console.log('✅ MongoDB connected');
      app.listen(PORT, () =>
        console.log(`🚀 Server running on port ${PORT}`)
      );
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      app.listen(PORT, () =>
        console.log(`⚠️ Server running on port ${PORT} (без БД)`)
      );
    });
} else {
  console.warn('⚠️ MONGODB_URI не указан — запускаем сервер без базы');
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT} (без БД)`)
  );
}

app.use((err, req, res, next) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
