// ./models/index.js
import mongoose from 'mongoose';
import CrimeReport from './CrimeReport.js';
import People from './People.js';
import Spec from './Spec.js';
import AuthUser from './AuthUser.js';

mongoose.set('strictQuery', true);


let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}
export async function connectDB(uri) {
  if (!uri) throw new Error('Mongo URI is required');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      const conn = m.connection;


      conn.on('connected', () => console.log('[mongoose] connected:', conn.name));
      conn.on('error', (err) => console.error('[mongoose] error:', err.message));
      conn.on('disconnected', () => console.warn('[mongoose] disconnected'));


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


export { CrimeReport, People, Spec, AuthUser };

export default {
  connectDB,
  CrimeReport,
  People,
  Spec,
  AuthUser,
};
