const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TestResult = sequelize.define('TestResult', {
  username: { type: DataTypes.STRING, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  timestamps: true,
});

module.exports = TestResult;
