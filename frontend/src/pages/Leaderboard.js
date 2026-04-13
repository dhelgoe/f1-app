import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/auth/leaderboard');
        setData(res.data.leaderboard || []);
        setError('');
      } catch (err) {
        setError('Could not load leaderboard.');
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  if (loading) return <div style={{ color: '#888', textAlign: 'center' }}>Loading leaderboard...</div>;
  if (error) return <div style={{ color: '#e10600', textAlign: 'center' }}>{error}</div>;

  return (
      <div className="leaderboard-container" style={{ marginTop: '2rem', position: 'relative' }}>
        <div className="f1-stripes" />
      <h3 style={{ marginTop: 0 }}>Today's Top 10</h3>
      {data.length === 0 ? (
        <div style={{ color: '#888' }}>No scores yet today.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: 'left' }}>Rank</th>
              <th style={{ textAlign: 'left' }}>Username</th>
              <th style={{ textAlign: 'right' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{i + 1}</td>
                <td>{row.username}</td>
                <td style={{ textAlign: 'right' }}>{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;
