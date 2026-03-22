import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5002/api';

function Dashboard() {
  const [worker, setWorker] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [esp32, setEsp32] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if(userId){
      fetchWorkerData();
      fetchEsp32();
      const interval = setInterval(()=>{ fetchWorkerData(); fetchEsp32(); }, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    if(worker){
      const hr = esp32 ? esp32.bpm : worker.heartRate;
      const temp = esp32 ? esp32.temperature : worker.temperature;
      checkHealthAlerts(hr, temp, worker.workTime);
    }
  }, [esp32, worker]);

  const fetchEsp32 = async () => {
    try {
      const res = await axios.get(`${API_URL}/esp32/latest`);
      setEsp32(res.data);
    } catch (err) {
      setEsp32(null);
    }
  };

  const fetchWorkerData = async () => {
    try {
      const response = await axios.get(`${API_URL}/workers/${userId}`);
      setWorker(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const checkHealthAlerts = (hr, temp, workTime) => {
    const newAlerts = [];
    let criticalCount = 0;

    if (hr > 120) {
      newAlerts.push({ type: 'critical', msg: '🚨 Critical: Heart rate very high (>120 BPM)! Take immediate rest, drink water, and do breathing exercises.' });
      criticalCount++;
    } else if (hr > 100) {
      newAlerts.push({ type: 'warning', msg: '⚠️ Warning: Heart rate elevated (>100 BPM). Slow down and take a short break.' });
    } else if (hr >= 60 && hr <= 100) {
      newAlerts.push({ type: 'info', msg: '✅ Heart rate is normal (60-100 BPM).' });
    }

    if (temp > 38.5) {
      newAlerts.push({ type: 'critical', msg: '🚨 Critical: High fever detected (>38.5°C)! Stop work immediately and seek medical help.' });
      criticalCount++;
    } else if (temp > 37.5) {
      newAlerts.push({ type: 'warning', msg: '⚠️ Warning: Elevated temperature (>37.5°C). Rest in a cool place and hydrate.' });
    } else if (temp >= 36.5 && temp <= 37.5) {
      newAlerts.push({ type: 'info', msg: '✅ Temperature is normal (36.5-37.5°C).' });
    }

    if (workTime > 10) {
      newAlerts.push({ type: 'critical', msg: '🚨 Critical: Excessive work hours (>10 hrs)! Mandatory rest required.' });
      criticalCount++;
    } else if (workTime > 8) {
      newAlerts.push({ type: 'warning', msg: '⚠️ Warning: Long work hours (>8 hrs). Take a break and drink water.' });
    } else if (workTime <= 8) {
      newAlerts.push({ type: 'info', msg: '✅ Work time is within normal limits.' });
    }

    if (criticalCount >= 2) {
      newAlerts.unshift({ type: 'critical', msg: '🚨 EMERGENCY: Multiple critical health conditions detected! Stop work immediately, rest in a cool place, drink water, and seek medical attention. Contact supervisor for immediate assistance.' });
    }

    setAlerts(newAlerts);
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Worker Dashboard</h1>

        {/* Worker Health Alerts */}
        {alerts.map((a, i) => (
          <div key={i} className={`alert alert-${a.type}`}>{a.msg}</div>
        ))}

        {/* Worker Health Cards */}
        {worker && (
          <div>
            <h2 style={{ marginBottom: '15px' }}>👤 Worker Health Data</h2>
            <div className="cards-grid">
              <div className="card">
                <h3>❤️ Heart Rate</h3>
                <p className="value">{esp32 ? esp32.bpm : worker.heartRate}</p>
                <p className="unit">BPM</p>
              </div>
              <div className="card">
                <h3>🌡️ Temperature</h3>
                <p className="value">{esp32 ? esp32.temperature?.toFixed(1) : (worker.temperature != null ? worker.temperature.toFixed(1) : '--')}</p>
                <p className="unit">°C</p>
              </div>
              <div className="card">
                <h3>😰 Stress Level</h3>
                <p className="value">{worker.stressLevel}</p>
              </div>
              <div className="card">
                <h3>⏰ Work Time</h3>
                <p className="value">{worker.workTime}</p>
                <p className="unit">hours</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
