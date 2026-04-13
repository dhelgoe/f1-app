const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  pin: { type: DataTypes.STRING, allowNull: false }, // Store as string for leading zeros
  lastTestDate: { type: DataTypes.DATEONLY, allowNull: true },
  secretAnswer: { type: DataTypes.STRING, allowNull: true }, // For PIN reset security
}, {
  timestamps: true,
});

module.exports = User;
