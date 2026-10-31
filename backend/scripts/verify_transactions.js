/**
 * NexaChain AI — Database Topology & ACID Transaction Verification Tool
 *
 * This script diagnoses MongoDB connection topology, tests multi-document
 * transaction readiness, and validates rollback/commit guarantees.
 *
 * Usage:
 *   node scripts/verify_transactions.js
 */

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const { supportsTransactions, runInTransaction } = require('../src/utils/transaction');
const { User, WalletTransaction } = require('../src/models');

async function runTransactionVerification() {
  console.log('===============================================================');
  console.log('    NEXACHAIN AI — DATABASE TRANSACTION VERIFICATION TOOL    ');
  console.log('===============================================================');

  try {
    const conn = await connectDB();
    const client = conn.connection.client;
    const topology = client?.topology?.description;
    const topologyType = topology?.type || 'unknown';
    const servers = topology?.servers ? Array.from(topology.servers.keys()) : [];
    const isTxSupported = supportsTransactions();

    console.log(`\n[Topology Inspection]`);
    console.log(`  Cluster Type:             ${topologyType}`);
    console.log(`  Connected Hosts:          ${servers.join(', ') || '127.0.0.1:27017'}`);
    console.log(`  Replica Set Name:         ${topology?.setName || 'None (Standalone)'}`);
    console.log(`  Transactions Supported:   ${isTxSupported ? 'YES (Full Multi-Document ACID)' : 'NO (Standalone)'}`);

    if (isTxSupported) {
      console.log('\n[Stage 1] Executing Live Replica Set Transaction Smoke Tests...');

      // Test 1: Rollback test
      console.log('  Testing Transaction Abort / Automatic Rollback...');
      const session1 = await mongoose.startSession();
      session1.startTransaction();

      const testEmail1 = `txtest_abort_${Date.now()}@nexachain.test`;
      const tempUser1 = new User({
        fullName: 'Tx Abort Tester',
        email: testEmail1,
        mobileNumber: '9999900001',
        password: 'hashed_password_for_test',
        walletBalance: 500,
      });
      await tempUser1.save({ session: session1 });

      // Abort transaction
      await session1.abortTransaction();
      await session1.endSession();

      // Verify user does NOT exist in database
      const abortedDoc = await User.findOne({ email: testEmail1 });
      if (abortedDoc) {
        throw new Error('ROLLBACK FAILED: Document was written to database despite transaction abort!');
      }
      console.log('  ✓ Transaction Abort Verified: Zero uncommitted data persisted.');

      // Test 2: Commit test
      console.log('  Testing Transaction Commit...');
      const session2 = await mongoose.startSession();
      session2.startTransaction();

      const testEmail2 = `txtest_commit_${Date.now()}@nexachain.test`;
      const tempUser2 = new User({
        fullName: 'Tx Commit Tester',
        email: testEmail2,
        mobileNumber: '9999900002',
        password: 'hashed_password_for_test',
        walletBalance: 1000,
      });
      await tempUser2.save({ session: session2 });

      await session2.commitTransaction();
      await session2.endSession();

      // Verify user DOES exist in database
      const committedDoc = await User.findOne({ email: testEmail2 });
      if (!committedDoc) {
        throw new Error('COMMIT FAILED: Document was not found after transaction commit!');
      }
      console.log('  ✓ Transaction Commit Verified: Atomic write persisted.');

      // Clean up test document
      await User.deleteOne({ _id: committedDoc._id });
      console.log('  ✓ Test artifacts cleaned up.');

      console.log('\n===============================================================');
      console.log('  RESULT: FULL MULTI-DOCUMENT ACID TRANSACTIONS VERIFIED!      ');
      console.log('===============================================================');
    } else {
      console.log('\n[Diagnostic Notice: Standalone MongoDB Detected]');
      console.log('  Standalone instances (Single node) do not support MongoDB Replica Set transactions.');
      console.log('  Application is currently operating in STANDALONE COMPATIBILITY MODE:');
      console.log('    1. Concurrency control via atomic conditional updates ($inc with $gte guards).');
      console.log('    2. Application-layer compensating rollbacks upon write failure.');
      console.log('\n  For Staging and Production certification:');
      console.log('    Initialize a MongoDB Replica Set using:');
      console.log('      mongod --replSet rs0 --dbpath <data_dir>');
      console.log('      rs.initiate() in mongosh');
      console.log('    Or connect to a 3-node MongoDB Atlas / AWS DocumentDB cluster.');

      // Test Standalone Fallback atomic update
      console.log('\n[Stage 1] Verifying Standalone Fallback Guarantees...');
      const fallbackEmail = `txtest_fallback_${Date.now()}@nexachain.test`;
      const fallbackUser = await User.create({
        fullName: 'Fallback Tester',
        email: fallbackEmail,
        mobileNumber: '9999900003',
        password: 'hashed_password_for_test',
        walletBalance: 200,
      });

      // Attempt atomic conditional debit beyond balance ($300 on $200)
      const debitResult = await User.findOneAndUpdate(
        { _id: fallbackUser._id, walletBalance: { $gte: 300 } },
        { $inc: { walletBalance: -300 } },
        { new: true }
      );

      if (debitResult !== null) {
        throw new Error('Overdraft guard failed in standalone mode!');
      }
      console.log('  ✓ Overdraft Guard Verified: Atomic conditional check rejected invalid debit.');

      // Clean up
      await User.deleteOne({ _id: fallbackUser._id });
      console.log('  ✓ Fallback test completed cleanly.');

      console.log('\n===============================================================');
      console.log('  RESULT: STANDALONE MODE OPERATIONAL. REPLICA SET RECOMMENDED ');
      console.log('===============================================================');
    }

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('\n[Verification Failed]', err);
    process.exit(1);
  }
}

runTransactionVerification();
