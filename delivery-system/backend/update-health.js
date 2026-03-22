// Test script to update health data
// Run this with: node update-health.js

const axios = require('axios');

// INSTRUCTIONS:
// 1. Login to your app first
// 2. Open browser console (F12)
// 3. Type: localStorage.getItem('userId')
// 4. Copy the userId and paste it below

const userId = 'PASTE_YOUR_USER_ID_HERE';

const healthData = {
  heartRate: 95,
  temperature: 37.8,
  stressLevel: 'High',
  workTime: 9
};

axios.post(`http://localhost:5002/api/workers/${userId}/health`, healthData)
  .then(response => {
    console.log('✅ Health data updated successfully!');
    console.log('New values:', healthData);
  })
  .catch(error => {
    console.error('❌ Error:', error.response?.data || error.message);
  });
