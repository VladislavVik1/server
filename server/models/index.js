// ./models/index.js
import mongoose from 'mongoose';
import CrimeReport from './CrimeReport.js';
import People from './People.js';
import Spec from './Spec.js';
import User from './User.js';

/**
 * Функция подключения к MongoDB
 * @param {string} uri - строка подключения к MongoDB
 * @returns {Promise<mongoose.Connection>}
 */
export function connectDB(uri) {
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Экспорт моделей
export {
  CrimeReport,
  People,
  Spec,
  User,
};

export default {
  connectDB,
  CrimeReport,
  People,
  Spec,
  User,
};
