
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Leaderboard from './Leaderboard';

function getBonusPoints(seconds) {
  const bonus = 10 - Math.floor(seconds / 6);
  return bonus < 1 ? 1 : bonus;
}

function Quiz({ onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(30);
  const [ranOutOfTime, setRanOutOfTime] = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/questions');
        setQuestions(res.data.questions);
        setLoading(false);
      } catch (err) {
        setError('Could not load questions.');
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Timer effect
  useEffect(() => {
    if (showResult || loading || error || questions.length === 0) return;
    setTimer(30);
    setRanOutOfTime(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setRanOutOfTime(true);
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [current, showResult, loading, error, questions.length]);

  const handleAnswer = (idx) => {
    if (showResult || ranOutOfTime) return;
    const timeTaken = (Date.now() - questionStart) / 1000;
    let points = 0;
    let bonus = 0;
    if (idx === questions[current].answer) {
      points = 10;
      bonus = getBonusPoints(timeTaken);
    }
    setResult({
      correct: idx === questions[current].answer,
      points,
      bonus,
      time: timeTaken.toFixed(2),
    });
    setScore((s) => s + points + bonus);
    setShowResult(true);
    clearInterval(timerRef.current);
  };

  const handleNext = () => {
    setShowResult(false);
    setResult({});
    setQuestionStart(Date.now());
    setCurrent((c) => c + 1);
    setTimer(30);
    setRanOutOfTime(false);
    clearInterval(timerRef.current);
  };

  if (loading) {
    return <div className="quiz-container"><h3>Loading questions...</h3></div>;
  }
  if (error) {
    return <div className="quiz-container"><h3 style={{color:'red'}}>{error}</h3></div>;
  }
  if (questions.length === 0) {
    return <div className="quiz-container"><h3>No questions available.</h3></div>;
  }
  if (current >= questions.length) {
    const username = localStorage.getItem('username');
    const handleShowLeaderboard = async () => {
      if (!showLeaderboard && username) {
        setSaving(true);
        try {
          await axios.post('http://localhost:5000/api/auth/save-result', { username, score });
        } catch (err) {
          // ignore error, leaderboard will still show
        }
        setSaving(false);
        setShowLeaderboard(true);
      }
    };
    return (
      <div className="quiz-container">
        <h2>Quiz Complete!</h2>
        <p>Your total score: <b>{score}</b></p>
        {!showLeaderboard ? (
          <button onClick={handleShowLeaderboard} disabled={saving}>
            {saving ? 'Saving...' : "View Today's Leaderboard"}
          </button>
        ) : (
          <Leaderboard />
        )}
        <button style={{ marginTop: '1.5rem' }} onClick={onFinish}>Back to Home</button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="quiz-container">
      <h3>Question {current + 1} of {questions.length}</h3>
      <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{q.question}</span>
        <span style={{ color: timer <= 5 ? 'red' : '#fff', fontWeight: 'bold', fontSize: 18 }}>⏰ {timer}s</span>
      </div>
      {q.image && (
        <img src={`http://localhost:5000/${q.image.startsWith('/') ? q.image.slice(1) : q.image}`} alt="track outline" style={{ display: 'block', margin: '1rem auto', maxWidth: '100%', border: '2px solid #e10600', borderRadius: 8 }} />
      )}
      <div style={{ marginBottom: '1rem' }}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            style={{ display: 'block', width: '100%', margin: '0.5rem 0' }}
            onClick={() => handleAnswer(i)}
            disabled={showResult || ranOutOfTime}
          >
            {opt}
          </button>
        ))}
      </div>
      {showResult && (
        <div style={{ margin: '1rem 0', color: ranOutOfTime ? 'orange' : result.correct ? 'green' : 'red' }}>
          {ranOutOfTime ? (
            <>Ran out of time!</>
          ) : result.correct ? (
            <>
              Correct! +10 points<br />
              Speed bonus: +{result.bonus} points (answered in {result.time}s)
            </>
          ) : (
            <>Wrong! 0 points</>
          )}
          <br />
          <button style={{ marginTop: '1rem' }} onClick={handleNext}>Next</button>
        </div>
      )}
      <div style={{ marginTop: '2rem', color: '#888' }}>Current Score: {score}</div>
    </div>
  );
}

export default Quiz;
