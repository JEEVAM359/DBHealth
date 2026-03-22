const mongoose = require('mongoose');

const reassignmentRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  fromWorkerId: { type: String, required: true },
  fromWorkerName: { type: String, required: true },
  toWorkerId: { type: String, required: true },
  toWorkerName: { type: String, required: true },
  orderId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  responseDate: { type: Date },
  completedDate: { type: Date },
  distance: { type: String },
  fromLocation: { latitude: Number, longitude: Number },
  toLocation: { latitude: Number, longitude: Number },
  deliveryLocation: { 
    latitude: Number, 
    longitude: Number,
    address: String
  }
});

module.exports = mongoose.model('ReassignmentRequest', reassignmentRequestSchema);
