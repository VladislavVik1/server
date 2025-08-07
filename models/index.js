import { Sequelize } from 'sequelize';
import UserModel from './User.js';
import ReportModel from './CrimeReport.js';
import PeopleModel from './People.js';
import SpecModel from './Spec.js';

// Инициализация подключения к SQLite
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

// Инициализация моделей
export const User = UserModel(sequelize);
export const CrimeReport = ReportModel(sequelize);
export const People = PeopleModel(sequelize);
export const Spec = SpecModel(sequelize);

// Связи между моделями
User.hasMany(CrimeReport, { foreignKey: 'userId' });
CrimeReport.belongsTo(User, { foreignKey: 'userId' });

// Экспорт для использования в приложении
export default {
  sequelize,
  User,
  CrimeReport,
  People,
  Spec,
};
