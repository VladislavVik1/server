// ./models/index.js
import mongoose from 'mongoose';
import CrimeReport from './CrimeReport.js';
import People from './People.js';
import Spec from './Spec.js';
import AuthUser from './AuthUser.js';

// Рекомендуется для ожидаемого поведения фильтров
mongoose.set('strictQuery', true);

// Кэш промиса подключения (чтобы в dev не создавать несколько коннектов)
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

/**
 * Подключение к MongoDB (с кэшем)
 * @param {string} uri
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectDB(uri) {
  if (!uri) throw new Error('Mongo URI is required');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      const conn = m.connection;

      // Лёгкие логи (по желанию)
      conn.on('connected', () => console.log('[mongoose] connected:', conn.name));
      conn.on('error', (err) => console.error('[mongoose] error:', err.message));
      conn.on('disconnected', () => console.warn('[mongoose] disconnected'));

      // Аккуратное закрытие по SIGINT (npm run dev и т.п.)
      process.once('SIGINT', async () => {
        await conn.close();
        console.log('[mongoose] connection closed on SIGINT');
        process.exit(0);
      });

      return conn;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Экспорт моделей
export { CrimeReport, People, Spec, AuthUser };

export default {
  connectDB,
  CrimeReport,
  People,
  Spec,
  AuthUser,
};
