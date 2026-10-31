const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const config = require('../src/config/env');

beforeAll(async () => {
  if (process.env.SKIP_DB_CONNECT === 'true') {
    return;
  }
  // Isolate automated tests to local test database to prevent dropping cloud/staging data
  const testDbUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/nexachain_test';
  await mongoose.connect(testDbUri, {
    serverSelectionTimeoutMS: 5000,
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    } catch (e) {
      console.error('Error during test DB teardown:', e.message);
    }
  }
});
