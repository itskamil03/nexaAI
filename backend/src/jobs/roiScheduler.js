const cron = require('node-cron');
const os = require('os');
const config = require('../config/env');
const { JobLock } = require('../models');
const { processAllActiveInvestments } = require('../services/roiService');
const { normalizeDate } = require('../utils/dateUtils');

// 30 minute stale lock expiration window
const STALE_LOCK_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Executes the scheduled ROI batch with distributed database locking.
 * Safe against concurrent cluster workers, stale locks, and crashes.
 *
 * @param {string} [targetDate] - Normalized calendar date string (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
const executeScheduledRoiBatch = async (targetDate = null) => {
  const normalizedDate = normalizeDate(targetDate, config.cronTimezone);
  const lockId = `daily_roi_${normalizedDate}`;
  const workerId = `${os.hostname()}:${process.pid}`;
  const staleThreshold = new Date(Date.now() - STALE_LOCK_TIMEOUT_MS);

  console.log(`[Scheduler] Attempting to acquire lock for: ${lockId} (Worker: ${workerId})`);

  // 1. Attempt to claim existing FAILED or STALE lock
  let lock;
  try {
    lock = await JobLock.findOneAndUpdate(
      {
        _id: lockId,
        $or: [
          { status: 'FAILED' },
          { status: 'PROCESSING', acquiredAt: { $lt: staleThreshold } },
        ],
      },
      {
        $set: {
          status: 'PROCESSING',
          workerId,
          acquiredAt: new Date(),
        },
      },
      { new: true }
    );

    if (!lock) {
      // 2. Try initial creation if document does not exist yet
      try {
        lock = new JobLock({
          _id: lockId,
          status: 'PROCESSING',
          workerId,
          acquiredAt: new Date(),
        });
        await lock.save();
      } catch (insertErr) {
        if (insertErr.code === 11000) {
          console.log(`[Scheduler] Lock already held or batch completed for ${lockId}. Skipping execution.`);
          return { skipped: true, reason: 'LOCK_ALREADY_ACQUIRED', lockId };
        }
        throw insertErr;
      }
    }
  } catch (err) {
    console.error(`[Scheduler] Error acquiring job lock: ${err.message}`);
    throw err;
  }

  // 3. Execute ROI service batch
  try {
    const summary = await processAllActiveInvestments(normalizedDate);

    // 4. Mark lock as COMPLETED
    await JobLock.findByIdAndUpdate(lockId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      details: summary,
    });

    console.log(`[Scheduler] Batch ${lockId} successfully completed.`);
    return summary;
  } catch (error) {
    console.error(`[Scheduler] Fatal error in batch ${lockId}:`, error);

    // Mark lock as FAILED to allow potential recovery/retry
    await JobLock.findByIdAndUpdate(lockId, {
      status: 'FAILED',
      completedAt: new Date(),
      details: { error: error.message },
    });

    throw error;
  }
};

/**
 * Initializes the node-cron automated scheduler.
 */
const startRoiScheduler = () => {
  console.log(
    `[Scheduler] Registering Daily ROI Cron: Schedule="${config.cronSchedule}", Timezone="${config.cronTimezone}"`
  );

  const task = cron.schedule(
    config.cronSchedule,
    async () => {
      console.log(`[Scheduler] Cron trigger fired at ${new Date().toISOString()}`);
      try {
        await executeScheduledRoiBatch();
      } catch (err) {
        console.error('[Scheduler] Cron execution failed:', err.message);
      }
    },
    {
      timezone: config.cronTimezone,
    }
  );

  return task;
};

module.exports = {
  startRoiScheduler,
  executeScheduledRoiBatch,
};
