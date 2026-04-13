import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ username: '', pin: '', secretAnswer: '' });
  const [error, setError] = useState('');
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
    if (!form.secretAnswer || form.secretAnswer.length < 2) {
      setError('Secret answer required (min 2 chars)');
      return;
    }
    try {
      await axios.post('https://f1-app-0vv0.onrender.com/api/auth/register', form);
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response ? JSON.stringify(err.response.data) : 'Registration failed')
      );
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div className="f1-stripes" />
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="pin" type="password" placeholder="PIN (1-10 digits)" value={form.pin} onChange={handleChange} required maxLength={10} pattern="[0-9]{1,10}" />
        <input name="secretAnswer" placeholder="Secret Answer (for PIN reset)" value={form.secretAnswer} onChange={handleChange} required minLength={2} style={{ marginTop: 8 }} />
        <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '0.5rem' }}>
          Do not use a PIN linked to anything important (e.g., bank, phone, etc.).<br />
          <b>Secret Answer:</b> Used to reset your PIN if you forget it. (e.g., favorite color, pet's name, etc.)
        </div>
        <button type="submit">Create Account</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default Register;
