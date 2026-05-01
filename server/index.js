require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/listings', listingsRoutes);

const getHealthPayload = () => ({
  ok: true,
  status: 'healthy',
  service: 'NourishNet API',
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

// Public health checks (no auth)
app.get('/health', (req, res) => {
  res.json(getHealthPayload());
});

app.get('/public/health', (req, res) => {
  res.json(getHealthPayload());
});

// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'NourishNet API',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/public/health',
      '/api',
      '/auth/start-signup',
      '/auth/send-signup-otp',
      '/auth/resend-signup-otp',
      '/auth/verify-signup-otp',
      '/auth/forgot-password',
      '/auth/verify-reset-otp',
      '/auth/verify-reset-otp-and-set-password',
      '/auth/change-password',
      '/auth/delete-user',
      '/listings (GET, POST)',
      '/listings/browse (GET)',
      '/listings/my-requests (GET)',
      '/listings/:id/my-request (GET)',
      '/listings/:id (PATCH, DELETE)',
      '/listings/:id/request (POST)',
      '/listings/:id/pickup-pin (POST)',
      '/listings/:id/verify-pin (POST)',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`NourishNet server running at http://localhost:${PORT}`);
});
