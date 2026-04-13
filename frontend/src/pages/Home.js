
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Quiz from './Quiz';
import Leaderboard from './Leaderboard';
import MonthlyLeaderboard from './MonthlyLeaderboard';
import { useNavigate } from 'react-router-dom';


function Home() {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [canTakeTest, setCanTakeTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testMsg, setTestMsg] = useState('');
  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    async function checkTest() {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/can-take-test/${username}`);
        setCanTakeTest(res.data.canTakeTest);
        setTestMsg(res.data.message || '');
      } catch (err) {
        setCanTakeTest(false);
        setTestMsg('Error checking test status.');
      }
      setLoading(false);
    }
    checkTest();
  }, [username, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
  };
  const handleStartTest = () => {
    setShowQuiz(true);
  };
  const handleQuizFinish = async () => {
    setShowQuiz(false);
    // Mark test as completed for today
    try {
      await axios.post('http://localhost:5000/api/auth/complete-test', { username });
      setCanTakeTest(false);
      setTestMsg("You've already completed today's test. Come back tomorrow!");
    } catch (err) {
      setTestMsg('Error marking test as completed.');
    }
  };
  if (showQuiz) {
    return <Quiz onFinish={handleQuizFinish} />;
  }
  return (
    <div className="home-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px', justifyContent: 'space-between', position: 'relative' }}>
      <div className="f1-stripes" />
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Welcome, {username}!</h2>
        <div style={{
          background: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '1rem',
          color: '#333',
        }}>
          <strong>Rules:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
            <li>You will get <b>5 questions</b> each day.</li>
            <li>You have <b>60 seconds</b> to answer each question.</li>
            <li>Each correct answer is worth <b>10 points</b>.</li>
            <li>Bonus points are awarded for faster correct answers (10-1 points based on speed).</li>
            <li>Wrong answers give <b>0 points</b> for that question.</li>
            <li>After each question, you will move to the next one.</li>
          </ul>
        </div>
        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', margin: '1rem 0' }}>Checking test status...</div>
        ) : canTakeTest ? (
          <button onClick={handleStartTest} style={{ width: '100%' }}>Start Test</button>
        ) : (
          <div style={{ color: '#e10600', textAlign: 'center', margin: '1rem 0' }}>{testMsg || "You've already completed today's test. Come back tomorrow!"}</div>
        )}
        {/* Always show the leaderboards below the test status/rules */}
        <Leaderboard />
        <MonthlyLeaderboard />
      </div>
      <button onClick={handleLogout} style={{ width: '100%', marginTop: '2rem', background: '#888' }}>Logout</button>
    </div>
  );
}

export default Home;
