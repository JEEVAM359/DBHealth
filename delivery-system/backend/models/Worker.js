const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  heartRate: { type: Number, default: 75 },
  temperature: { type: Number, default: 36.5 },
  stressLevel: { type: String, default: 'Normal' },
  workTime: { type: Number, default: 0 },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  currentOrders: { type: Number, default: 0 },
  orderHistory: [{ orderId: String, date: Date, status: String }],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', workerSchema);
