import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/signup`, { name, email, bikeNumber, deviceId, password });
      setMessage('✅ Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>🚚 Delivery Monitoring System</h1>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Bike Number</label>
            <input type="text" value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Device ID (ESP32)</label>
            <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. esp32_device_01" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
          </div>
          <button type="submit" className="btn-primary">Sign Up</button>
          <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
        </form>
        {message && <div className="message"><span className={message.includes('✅') ? 'success' : 'error'}>{message}</span></div>}
      </div>
    </div>
  );
}

export default Signup;
