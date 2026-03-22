const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Worker = require('./models/Worker');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Create sample workers if none exist
    const count = await Worker.countDocuments();
    if (count === 0) {
      await Worker.insertMany([
        {
          workerId: 'W001',
          name: 'John Doe',
          phone: '+1234567890',
          heartRate: 150,
          temperature: 39.0,
          stressLevel: 'High',
          workTime: 5,
          latitude: 11.0168,
          longitude: 76.9558,
          currentOrders: 2,
          orderHistory: []
        },
        {
          workerId: 'W002',
          name: 'Jane Smith',
          phone: '+1234567891',
          heartRate: 115,
          temperature: 37.8,
          stressLevel: 'High',
          workTime: 9,
          latitude: 11.0168,
          longitude: 76.9674,
          currentOrders: 4,
          orderHistory: [{ orderId: 'ORD003', date: new Date('2024-01-15'), status: 'Delivered' }]
        },
        {
          workerId: 'W003',
          name: 'Mike Johnson',
          phone: '+1234567892',
          heartRate: 72,
          temperature: 36.5,
          stressLevel: 'Normal',
          workTime: 3,
          latitude: 11.0248,
          longitude: 76.9547,
          currentOrders: 1,
          orderHistory: []
        }
      ]);
      console.log('✅ Sample workers created');
    }
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, name: user.name });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Worker Routes
app.post('/api/workers', async (req, res) => {
  try {
    const worker = new Worker(req.body);
    await worker.save();
    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create worker' });
  }
});

app.get('/api/workers', async (req, res) => {
  try {
    const workers = await Worker.find();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

app.get('/api/workers/:workerId', async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.workerId });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

app.put('/api/workers/:workerId', async (req, res) => {
  try {
    const worker = await Worker.findOneAndUpdate(
      { workerId: req.params.workerId },
      { ...req.body, lastUpdated: Date.now() },
      { new: true }
    );
    res.json(worker);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update worker' });
  }
});

app.post('/api/workers/:workerId/reassign', async (req, res) => {
  try {
    const { targetWorkerId } = req.body;
    const sourceWorker = await Worker.findOne({ workerId: req.params.workerId });
    const targetWorker = await Worker.findOne({ workerId: targetWorkerId });
    
    if (!sourceWorker || !targetWorker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    if (sourceWorker.currentOrders > 0) {
      sourceWorker.currentOrders -= 1;
      targetWorker.currentOrders += 1;
      await sourceWorker.save();
      await targetWorker.save();
    }
    
    res.json({ message: 'Order reassigned successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to reassign order' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
