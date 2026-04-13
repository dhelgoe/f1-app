const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MonthlyWinner = sequelize.define('MonthlyWinner', {
  yearMonth: { type: DataTypes.STRING, allowNull: false }, // 'YYYY-MM'
  username: { type: DataTypes.STRING, allowNull: false },
  totalScore: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
});

module.exports = MonthlyWinner;
