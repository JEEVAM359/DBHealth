const axios = require('axios');

// Replace with your actual userId from MongoDB
const userId = 'YOUR_USER_ID_HERE';

const healthData = {
  heartRate: 85,
  temperature: 37.2,
  stressLevel: 'Normal',
  workTime: 6
};

axios.post(`http://localhost:5002/api/workers/${userId}/health`, healthData)
  .then(response => {
    console.log('Health data updated:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
