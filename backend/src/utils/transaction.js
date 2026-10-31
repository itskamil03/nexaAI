const mongoose = require('mongoose');

/**
 * Checks whether the current MongoDB deployment supports multi-document ACID transactions.
 * Transactions require a ReplicaSet (ReplicaSetWithPrimary) or Sharded cluster.
 * Standalone deployments (type === 'Single') do NOT support multi-document transactions.
 *
 * @returns {boolean} True if replica set transactions are supported
 */
const supportsTransactions = () => {
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  return topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';
};

/**
 * Executes a callback within an ACID transaction session if supported by the database topology,
 * or falls back to executing with session = null on standalone deployments.
 *
 * @param {Function} callback - Function receiving (session) and returning a promise
 * @returns {Promise<any>} Result of callback
 */
const runInTransaction = async (callback) => {
  if (!supportsTransactions()) {
    // Standalone fallback: execute without session (relies on atomic operators & compensating writes)
    return callback(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      console.error('[Transaction] Error during abortTransaction:', abortErr.message);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  supportsTransactions,
  runInTransaction,
};
