const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexachain',
  jwtSecret: process.env.JWT_SECRET || 'nexachain_super_secure_jwt_secret_key_2026_dev_env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cronSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
  cronTimezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminSecretKey: process.env.ADMIN_SECRET_KEY || 'nexachain_admin_secret_cron_override_key',
};

module.exports = config;
