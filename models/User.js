import { DataTypes } from 'sequelize'

export default (sequelize) => {
  return sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    role: { type: DataTypes.ENUM('public', 'responder'), defaultValue: 'public' },
  })
}
