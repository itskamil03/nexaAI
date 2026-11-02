const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const referralRoutes = require('./routes/referralRoutes');
const roiRoutes = require('./routes/roiRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const configuredOrigins = (config.clientUrl || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  ...configuredOrigins,
  'https://nexa-ai-nine-ecru.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://localhost:4173',
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.has(normalized)) return true;
  // Match any Vercel production or preview deployment for this project
  if (/^https:\/\/nexa-ai[a-z0-9-]*\.vercel\.app$/.test(normalized)) {
    return true;
  }
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin) || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
      return callback(null, true);
    }
    return callback(new Error(`Cross-Origin Request Blocked by CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Request Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check & Readiness Handler
const healthCheckHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const topologyType = mongoose.connection.client?.topology?.description?.type || 'unknown';
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'nexachain-backend',
    database: dbStatusMap[dbState] || 'unknown',
    databaseTopology: topologyType,
    transactionsSupported: ['ReplicaSetWithPrimary', 'Sharded'].includes(topologyType),
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.nodeEnv,
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Root Gateway Information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'NexaChain AI Backend Gateway',
    version: '1.0.0',
    status: 'online',
    portal: config.clientUrl || 'https://nexa-ai-guuc.vercel.app',
    healthCheck: '/api/health',
    endpoints: {
      auth: '/api/auth',
      investments: '/api/investments',
      dashboard: '/api/dashboard',
      referrals: '/api/referrals',
      roi: '/api/roi',
      wallet: '/api/wallet',
      admin: '/api/admin',
    },
    message: 'Welcome to NexaChain AI Institutional Investment & Referral API Gateway.',
  });
});

// Root API Information
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'NexaChain AI API',
    version: '1.0.0',
    healthCheck: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/investments',
      '/api/dashboard',
      '/api/referrals',
      '/api/roi',
      '/api/wallet',
      '/api/admin',
    ],
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/roi', roiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
