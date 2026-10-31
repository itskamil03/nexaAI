const { maskMongoUri } = require('../../src/config/db');
const { validateConfig, config } = require('../../src/config/env');
const mongoose = require('mongoose');

describe('Deployment Configuration & Reliability Tests', () => {
  describe('URI Credential Masking (maskMongoUri)', () => {
    it('should mask user and password in standard and srv MongoDB URIs', () => {
      const sensitiveUri = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.vkqmpeu.mongodb.net/cma?retryWrites=true&w=majority';
      const masked = maskMongoUri(sensitiveUri);
      expect(masked).not.toContain('SuperSecretPassword123');
      expect(masked).toBe('mongodb+srv://admin_user:******@cluster0.vkqmpeu.mongodb.net/cma?retryWrites=true&w=majority');
    });

    it('should safely handle empty or missing URI strings', () => {
      expect(maskMongoUri('')).toBe('[NOT_CONFIGURED]');
      expect(maskMongoUri(null)).toBe('[NOT_CONFIGURED]');
      expect(maskMongoUri(undefined)).toBe('[NOT_CONFIGURED]');
    });
  });

  describe('Configuration Validation (validateConfig)', () => {
    it('should pass in development mode without throwing', () => {
      expect(() => validateConfig()).not.toThrow();
    });

    it('should fail with descriptive error if required production variables are missing in production/staging', () => {
      // Temporarily simulate missing variables in production
      const originalEnv = config.nodeEnv;
      const originalMongo = config.mongodbUri;
      try {
        config.nodeEnv = 'production';
        config.mongodbUri = '';
        expect(() => validateConfig()).toThrow(/MONGODB_URI is required/);
      } finally {
        config.nodeEnv = originalEnv;
        config.mongodbUri = originalMongo;
      }
    });

    it('should reject localhost MongoDB URI in production/staging', () => {
      const originalEnv = config.nodeEnv;
      const originalMongo = config.mongodbUri;
      try {
        config.nodeEnv = 'production';
        config.mongodbUri = 'mongodb://127.0.0.1:27017/nexachain';
        expect(() => validateConfig()).toThrow(/cannot point to localhost/);
      } finally {
        config.nodeEnv = originalEnv;
        config.mongodbUri = originalMongo;
      }
    });
  });

  describe('Health Status Calculation', () => {
    it('should compute degraded status (HTTP 503 equivalent) when mongoose is disconnected', () => {
      const dbState = mongoose.connection.readyState; // 0 = disconnected
      const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      const topologyType = mongoose.connection.client?.topology?.description?.type || 'unknown';
      const isHealthy = dbState === 1;

      expect(isHealthy).toBe(false);
      expect(dbStatusMap[dbState]).toBe('disconnected');
      expect(['ReplicaSetWithPrimary', 'Sharded'].includes(topologyType)).toBe(false);
    });
  });

  describe('CORS Origin Parsing & Trailing-Slash Sanitization', () => {
    it('should clean trailing slashes from configured origins and match incoming origins', () => {
      const rawConfig = 'https://nexa-ai-nine-ecru.vercel.app/, http://localhost:5173/';
      const cleaned = rawConfig
        .split(',')
        .map(url => url.trim().replace(/\/+$/, ''))
        .filter(Boolean);

      expect(cleaned).toContain('https://nexa-ai-nine-ecru.vercel.app');
      expect(cleaned).toContain('http://localhost:5173');

      // Test origin matching
      const incomingOrigin = 'https://nexa-ai-nine-ecru.vercel.app';
      const normalizedIncoming = incomingOrigin.replace(/\/+$/, '');
      expect(cleaned.includes(normalizedIncoming)).toBe(true);
    });
  });

  describe('Frontend API URL Normalization', () => {
    it('should normalize baseURL regardless of trailing slash or missing /api suffix', () => {
      const normalize = (raw) => {
        const clean = (raw || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
        return clean.endsWith('/api') ? clean : `${clean}/api`;
      };

      expect(normalize('https://nexachain-backend.onrender.com')).toBe('https://nexachain-backend.onrender.com/api');
      expect(normalize('https://nexachain-backend.onrender.com/')).toBe('https://nexachain-backend.onrender.com/api');
      expect(normalize('https://nexachain-backend.onrender.com/api')).toBe('https://nexachain-backend.onrender.com/api');
      expect(normalize('https://nexachain-backend.onrender.com/api/')).toBe('https://nexachain-backend.onrender.com/api');
      expect(normalize('')).toBe('http://localhost:5000/api');
    });
  });
});
