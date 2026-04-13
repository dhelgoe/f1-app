const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const TestResult = require('./models/TestResult');


const path = require('path');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());
// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Import routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Serve 5 new questions each day from questions.json
app.get('/api/questions', (req, res) => {
  const questionsPath = path.join(__dirname, 'questions_shuffled.json');
  let questions = [];
  try {
    questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ message: 'Could not load questions.' });
  }
  // Deterministic daily selection: use day number since epoch
  const today = new Date();
  const dayNum = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  // Shuffle questions with a seeded shuffle (simple deterministic)
  function seededShuffle(arr, seed) {
    let a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const shuffled = seededShuffle(questions, dayNum);
  const todaysQuestions = shuffled.slice(0, 5);
  res.json({ questions: todaysQuestions });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => console.error(err));
