const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const MonthlyWinner = require('../models/MonthlyWinner');

const router = express.Router();

// DEBUG: Print all today's results
router.get('/debug/todays-results', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const results = await TestResult.findAll({ where: { date: today }, order: [['score', 'DESC'], ['createdAt', 'ASC']] });
    res.json({ results });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ message: 'Server error fetching today\'s results.' });
  }
});

// Reset PIN for a user (admin only)
router.post('/reset-pin', async (req, res) => {
  // Require JWT in Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'changeme');
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  // Only allow admin user to reset PINs
  const adminUser = await User.findByPk(decoded.userId);
  if (!adminUser || adminUser.username !== 'admin') {
    return res.status(403).json({ message: 'Only admin can reset PINs' });
  }
  const { username, newPin } = req.body;
  if (!/^[0-9]{1,10}$/.test(newPin)) {
    return res.status(400).json({ message: 'PIN must be 1-10 digits' });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const hashedPin = await require('bcryptjs').hash(newPin, 10);
    user.pin = hashedPin;
    await user.save();
    res.json({ message: 'PIN reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error resetting PIN.' });
  }
});
// List all users (excluding PINs for security)
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'createdAt', 'lastTestDate'] });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// Get monthly leaderboard (top 10)
router.get('/leaderboard-month', async (req, res) => {
  // Get current year and month in YYYY-MM format
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
  try {
    // Use raw SQL for grouping and summing scores by username for the month
    const [results] = await TestResult.sequelize.query(`
      SELECT username, SUM(score) as "totalScore"
      FROM "TestResults"
      WHERE TO_CHAR(date, 'YYYY-MM') = :yearMonth
      GROUP BY username
      ORDER BY "totalScore" DESC, MIN("createdAt") ASC
      LIMIT 10;
    `, {
      replacements: { yearMonth },
      type: TestResult.sequelize.QueryTypes.SELECT,
    });
    res.json({ leaderboard: results });
  } catch (err) {
    console.error('Monthly leaderboard error:', err);
    res.status(500).json({ message: 'Server error fetching monthly leaderboard.' });
  }
});

// Get monthly winners (one per month)
router.get('/monthly-winners', async (req, res) => {
  try {
    // Get all monthly winners, most recent first
    const winners = await MonthlyWinner.findAll({
      order: [['yearMonth', 'DESC']],
      limit: 12 // last 12 months
    });
    res.json({ winners });
  } catch (err) {
    console.error('Monthly winners error:', err);
    res.status(500).json({ message: 'Server error fetching monthly winners.' });
  }
});

// Save test result
router.post('/save-result', async (req, res) => {
  const { username, score } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  console.log('Attempting to save result:', { username, score, date: today });
  if (!username || typeof score !== 'number') {
    console.error('Missing username or score:', { username, score });
    return res.status(400).json({ message: 'Missing username or score.' });
  }
  try {
    const result = await TestResult.create({ username, score, date: today });
    console.log('Result saved successfully:', result.toJSON());
    res.json({ message: 'Result saved.' });
  } catch (err) {
    console.error('Save result error:', err);
    res.status(500).json({ message: 'Server error saving result.' });
  }
});

// Get daily leaderboard (top 10)
router.get('/leaderboard', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const results = await TestResult.findAll({
      where: { date: today },
      order: [['score', 'DESC'], ['createdAt', 'ASC']],
      limit: 10,
    });
    res.json({ leaderboard: results });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Server error fetching leaderboard.' });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { username, pin, secretAnswer } = req.body;
  try {
    if (!/^[0-9]{1,10}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be 1-10 digits' });
    }
    if (!secretAnswer || secretAnswer.length < 2) {
      return res.status(400).json({ message: 'Secret answer required (min 2 chars)' });
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'Username already in use' });
    const hashedPin = await bcrypt.hash(pin, 10);
    await User.create({ username, pin: hashedPin, secretAnswer });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: err.errors?.[0]?.message || err.message });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Forgot PIN (self-service reset with secret answer)
router.post('/forgot-pin', async (req, res) => {
  const { username, answer, newPin } = req.body;
  if (!username || !answer || !newPin) {
    return res.status(400).json({ message: 'All fields required' });
  }
  if (!/^[0-9]{1,10}$/.test(newPin)) {
    return res.status(400).json({ message: 'PIN must be 1-10 digits' });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.secretAnswer || user.secretAnswer.toLowerCase() !== answer.toLowerCase()) {
      return res.status(403).json({ message: 'Secret answer incorrect' });
    }
    const hashedPin = await require('bcryptjs').hash(newPin, 10);
    user.pin = hashedPin;
    await user.save();
    res.json({ message: 'PIN reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error resetting PIN.' });
  }
});

// Check if user can take today's test
router.get('/can-take-test/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ canTakeTest: false, message: 'User not found' });
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastTestDate === today) {
      return res.json({ canTakeTest: false, message: "You've already completed today's test." });
    }
    return res.json({ canTakeTest: true });
  } catch (err) {
    res.status(500).json({ canTakeTest: false, message: 'Server error' });
  }
});

// Mark test as completed for today
router.post('/complete-test', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const today = new Date().toISOString().slice(0, 10);
    user.lastTestDate = today;
    await user.save();
    res.json({ message: 'Test marked as completed for today.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, pin } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
