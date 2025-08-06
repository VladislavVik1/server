import { Sequelize } from 'sequelize'
import UserModel from './User.js'
import ReportModel from './CrimeReport.js'

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
})

export const User = UserModel(sequelize)
export const CrimeReport = ReportModel(sequelize)

User.hasMany(CrimeReport)
CrimeReport.belongsTo(User)
