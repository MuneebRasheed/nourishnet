require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'NourishNet API is running' });
});

// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'NourishNet API',
    version: '1.0.0',
    endpoints: ['/health', '/api', '/auth/send-signup-otp', '/auth/verify-signup-otp', '/auth/forgot-password', '/auth/verify-reset-otp', '/auth/verify-reset-otp-and-set-password', '/auth/change-password', '/auth/delete-user'],
  });
});

app.listen(PORT, () => {
  console.log(`NourishNet server running at http://localhost:${PORT}`);
});
