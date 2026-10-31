const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

// Ensure Windows resolves mongodb+srv SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Use system default if restricted
}

/**
 * Safely masks credentials in MongoDB URI string.
 * Never exposes passwords or username hashes in stdout or error logs.
 */
const maskMongoUri = (uri) => {
  if (!uri) return '[NOT_CONFIGURED]';
  try {
    return uri.replace(/\/\/(.*?):(.*?)@/, '//$1:******@');
  } catch (e) {
    return '[MASKED_URI]';
  }
};

const connectDB = async () => {
  try {
    const maskedTarget = maskMongoUri(config.mongodbUri);
    console.log(`[MongoDB] Initializing connection to: ${maskedTarget}`);

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
    const safeTarget = maskMongoUri(config.mongodbUri);
    console.error(`[MongoDB] Connection failed to ${safeTarget}: ${error.message}`);
    if (error.name === 'MongoServerSelectionError') {
      console.error('[MongoDB Diagnostic] Server selection timed out. Please verify:');
      console.error('  1. MongoDB Atlas Network Access: Whitelist Render/hosting outbound IPs or 0.0.0.0/0.');
      console.error('  2. MongoDB Atlas Database User: Verify username, password, and readWriteAnyDatabase permissions.');
      console.error('  3. Network DNS: Ensure SRV record lookup is accessible from the deployment environment.');
    }
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

module.exports = { connectDB, disconnectDB, maskMongoUri };
