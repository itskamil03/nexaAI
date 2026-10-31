/**
 * NexaChain AI — Safe MongoDB URI Verification Script
 * Validates connection without exposing passwords or sensitive credentials.
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function maskUri(uri) {
  if (!uri) return 'NOT_CONFIGURED';
  try {
    return uri.replace(/\/\/(.*?):(.*?)@/, '//$1:******@');
  } catch (e) {
    return 'MASKED_URI';
  }
}

async function verifyUri() {
  const uri = process.env.MONGODB_URI;
  console.log('===============================================================');
  console.log('         NEXACHAIN AI — MONGODB URI VERIFICATION               ');
  console.log('===============================================================');
  console.log(`Target URI:              ${maskUri(uri)}`);

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const topology = conn.connection.client?.topology?.description?.type || 'unknown';
    const setName = conn.connection.client?.topology?.description?.setName || 'None (Standalone)';
    const hosts = conn.connection.client?.topology?.description?.servers
      ? Array.from(conn.connection.client.topology.description.servers.keys())
      : [conn.connection.host];
    const isReplicaSet = ['ReplicaSetWithPrimary', 'Sharded'].includes(topology);

    console.log('\n[Verification Results]');
    console.log(`  Connection Status:     CONNECTED_SUCCESSFULLY (HTTP 200 equivalent)`);
    console.log(`  Database Name:         ${conn.connection.name}`);
    console.log(`  Connected Host(s):     ${hosts.join(', ')}`);
    console.log(`  Topology Type:         ${topology}`);
    console.log(`  Replica Set Name:      ${setName}`);
    console.log(`  Transactions Enabled:  ${isReplicaSet ? 'YES (Multi-Document ACID)' : 'NO (Standalone Compatibility Mode)'}`);

    console.log('\n===============================================================');
    console.log('  RESULT: MONGODB URI IS VALID AND FULLY FUNCTIONAL!           ');
    console.log('===============================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n[Verification Results]');
    console.error(`  Connection Status:     FAILED`);
    console.error(`  Error Message:         ${error.message}`);
    console.log('\n===============================================================');
    console.log('  RESULT: UNABLE TO CONNECT TO MONGODB WITH PROVIDED URI       ');
    console.log('===============================================================');
    process.exit(1);
  }
}

verifyUri();
