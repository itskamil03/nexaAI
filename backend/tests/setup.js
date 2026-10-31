const mongoose = require('mongoose');
const config = require('../src/config/env');

beforeAll(async () => {
  // Use a dedicated test database
  const testDbUri = config.mongodbUri.replace('/nexachain', '/nexachain_test');
  await mongoose.connect(testDbUri);
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
