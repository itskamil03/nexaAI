const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Attempt to load .env from backend/.env or root .env
const envPaths = [
  path.resolve(__dirname, '../../.env'), // backend/.env
  path.resolve(__dirname, '../../../.env'), // root .env
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}
dotenv.config(); // Also read from standard environment if injected by cloud host

const nodeEnv = process.env.NODE_ENV || 'development';
const isProductionLike = ['production', 'staging'].includes(nodeEnv);

const DEFAULT_DEV_JWT = 'nexachain_super_secure_jwt_secret_key_2026_dev_env';
const DEFAULT_DEV_ADMIN = 'nexachain_admin_secret_cron_override_key';
const DEFAULT_DEV_MONGO = 'mongodb://127.0.0.1:27017/nexachain';

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  mongodbUri: process.env.MONGODB_URI || (isProductionLike ? '' : DEFAULT_DEV_MONGO),
  jwtSecret: process.env.JWT_SECRET || (isProductionLike ? '' : DEFAULT_DEV_JWT),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cronSchedule: process.env.CRON_SCHEDULE || '0 0 * * *',
  cronTimezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  clientUrl: process.env.CLIENT_URL || (isProductionLike ? '' : 'http://localhost:5173'),
  adminSecretKey: process.env.ADMIN_SECRET_KEY || (isProductionLike ? '' : DEFAULT_DEV_ADMIN),
};

/**
 * Validates configuration for runtime environment.
 * Fails fast with clear diagnostics if required variables are missing or insecure in production/staging.
 * Never prints secret values.
 */
const validateConfig = (targetEnv = config.nodeEnv) => {
  const errors = [];
  const isTargetProductionLike = ['production', 'staging'].includes(targetEnv);

  if (isTargetProductionLike) {
    if (!config.mongodbUri) {
      errors.push('MONGODB_URI is required in production/staging and cannot be empty.');
    } else if (config.mongodbUri.includes('127.0.0.1') || config.mongodbUri.includes('localhost')) {
      errors.push('MONGODB_URI cannot point to localhost/127.0.0.1 in production/staging.');
    }

    if (!config.jwtSecret) {
      errors.push('JWT_SECRET is required in production/staging.');
    } else if (config.jwtSecret === DEFAULT_DEV_JWT) {
      errors.push('JWT_SECRET must not use the hardcoded default development secret in production/staging.');
    } else if (config.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for cryptographic security.');
    }

    if (!config.adminSecretKey) {
      errors.push('ADMIN_SECRET_KEY is required in production/staging.');
    } else if (config.adminSecretKey === DEFAULT_DEV_ADMIN) {
      errors.push('ADMIN_SECRET_KEY must not use the default development secret in production/staging.');
    } else if (config.adminSecretKey.length < 16) {
      errors.push('ADMIN_SECRET_KEY must be at least 16 characters long.');
    }

    if (!config.clientUrl) {
      errors.push('CLIENT_URL is required in production/staging for secure CORS configuration.');
    }
  }

  if (errors.length > 0) {
    const errorMsg = `[Config Validation Error]\n  - ${errors.join('\n  - ')}`;
    throw new Error(errorMsg);
  }

  return true;
};

module.exports = config;
module.exports.config = config;
module.exports.validateConfig = validateConfig;
