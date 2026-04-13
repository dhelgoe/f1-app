import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ username: '', pin: '' });
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{1,10}$/.test(form.pin)) {
      setError('PIN must be 1-10 digits');
      return;
    }
    try {
      const res = await axios.post('https://f1-app-0vv0.onrender.com/api/auth/login', form);
      if (res.data.token && res.data.username) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        window.location.href = '/';
      } else {
        setError('Login failed: Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setResetErr('');
    if (!resetUsername || !resetAnswer || !resetPin) {
      setResetErr('All fields required.');
      return;
    }
    if (!/^[0-9]{1,10}$/.test(resetPin)) {
      setResetErr('PIN must be 1-10 digits');
      return;
    }
    try {
      const res = await axios.post('https://f1-app-0vv0.onrender.com/api/auth/forgot-pin', {
        username: resetUsername,
        answer: resetAnswer,
        newPin: resetPin
      });
      setResetMsg(res.data.message || 'PIN reset!');
      // After a short delay, close the reset form and clear fields
      setTimeout(() => {
        setShowReset(false);
        setResetUsername('');
        setResetAnswer('');
        setResetPin('');
        setResetMsg('');
        setResetErr('');
      }, 1200);
    } catch (err) {
      setResetErr(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div className="f1-stripes" />
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="pin" type="password" placeholder="PIN (1-10 digits)" value={form.pin} onChange={handleChange} required maxLength={10} pattern="[0-9]{1,10}" />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>Don't have an account? <Link to="/register">Create Account</Link></p>
      <p style={{ marginTop: 16 }}>
        <button type="button" style={{ background: 'none', color: '#007bff', border: 'none', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setShowReset(!showReset)}>
          Forgot PIN?
        </button>
      </p>
      {showReset && (
        <div style={{ marginTop: 20, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3>Reset PIN</h3>
          <form onSubmit={handleReset}>
            <input placeholder="Username" value={resetUsername} onChange={e => setResetUsername(e.target.value)} required style={{ width: '100%', marginBottom: 8 }} />
            <input placeholder="Secret Answer" value={resetAnswer} onChange={e => setResetAnswer(e.target.value)} required style={{ width: '100%', marginBottom: 8 }} />
            <input placeholder="New PIN (1-10 digits)" value={resetPin} onChange={e => setResetPin(e.target.value)} required pattern="[0-9]{1,10}" style={{ width: '100%', marginBottom: 8 }} />
            <button type="submit" style={{ width: '100%' }}>Reset PIN</button>
          </form>
          {resetMsg && <div style={{ color: 'green', marginTop: 8 }}>{resetMsg}</div>}
          {resetErr && <div style={{ color: 'red', marginTop: 8 }}>{resetErr}</div>}
          <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            * You must answer your secret question to reset your PIN.
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
