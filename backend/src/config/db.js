const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

// Ensure Windows resolves mongodb+srv SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Use system default if restricted
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 5,
      autoIndex: config.nodeEnv !== 'production',
    });

    const topologyType = conn.connection.client?.topology?.description?.type || 'unknown';
    const isReplicaSet = ['ReplicaSetWithPrimary', 'Sharded'].includes(topologyType);

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`[MongoDB] Topology: ${topologyType} | Multi-Document ACID Transactions: ${isReplicaSet ? 'ENABLED' : 'DISABLED (Standalone fallback)'}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    if (config.nodeEnv !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed successfully');
  } catch (error) {
    console.error(`[MongoDB] Error closing connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
