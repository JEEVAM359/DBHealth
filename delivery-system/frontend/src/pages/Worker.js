import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5002/api';

function Worker() {
  const [worker, setWorker] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) loadWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadWorker = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/${userId}`);
      setWorker(res.data);
    } catch (err) {
      console.error('Error loading worker:', err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>👤 Worker Health Data</h1>
        {!worker ? (
          <p>Loading worker details...</p>
        ) : (
          <div className="worker-profile">
            <div className="profile-grid">
              <div className="profile-item">
                <strong>❤️ Heart Rate</strong>
                <span>{worker.heartRate ?? '--'} BPM</span>
              </div>
              <div className="profile-item">
                <strong>🌡️ Temperature</strong>
                <span>{worker.temperature != null ? worker.temperature.toFixed(1) : '--'} °C</span>
              </div>
              <div className="profile-item">
                <strong>😰 Stress Level</strong>
                <span>{worker.stressLevel ?? '--'}</span>
              </div>
              <div className="profile-item">
                <strong>⏰ Work Time</strong>
                <span>{worker.workTime ?? '--'} hours</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Worker;
