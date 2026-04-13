import React, { useState } from 'react';
import axios from 'axios';

function ResetPinPage() {
  const [username, setUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post(
        'https://f1-app-0vv0.onrender.com/api/auth/reset-pin',
        { username, newPin },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMessage(res.data.message || 'PIN reset successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error resetting PIN. Make sure you are admin.'
      );
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Admin: Reset User PIN</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Username:<br />
            <input value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>New PIN (1-10 digits):<br />
            <input value={newPin} onChange={e => setNewPin(e.target.value)} required pattern="[0-9]{1,10}" style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Admin JWT Token:<br />
            <input value={adminToken} onChange={e => setAdminToken(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit" style={{ width: '100%' }}>Reset PIN</button>
      </form>
      {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
}

export default ResetPinPage;
