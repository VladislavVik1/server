import { DataTypes } from 'sequelize'

export default (sequelize) => {
  return sequelize.define('CrimeReport', {
    type: DataTypes.STRING,
    description: DataTypes.TEXT,
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM('new', 'investigating', 'resolved'),
      defaultValue: 'new',
    },
    imagePath: DataTypes.STRING,
  })
}
