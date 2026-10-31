const cron = require('node-cron');
const os = require('os');
const config = require('../config/env');
const { JobLock } = require('../models');
const { processAllActiveInvestments } = require('../services/roiService');
const { normalizeDate } = require('../utils/dateUtils');

/**
 * Executes the scheduled ROI batch with distributed database locking.
 * Safe against concurrent cluster workers and duplicate executions.
 *
 * @param {string} [targetDate] - Normalized calendar date string (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
const executeScheduledRoiBatch = async (targetDate = null) => {
  const normalizedDate = normalizeDate(targetDate);
  const lockId = `daily_roi_${normalizedDate}`;
  const workerId = `${os.hostname()}:${process.pid}`;

  console.log(`[Scheduler] Attempting to acquire lock for: ${lockId} (Worker: ${workerId})`);

  // 1. Attempt to acquire distributed lock
  let lock;
  try {
    lock = await JobLock.findOneAndUpdate(
      {
        _id: lockId,
        status: { $in: ['FAILED'] }, // Allow retry if previously failed
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
      // Try initial creation if document does not exist
      lock = new JobLock({
        _id: lockId,
        status: 'PROCESSING',
        workerId,
        acquiredAt: new Date(),
      });
      await lock.save();
    }
  } catch (err) {
    if (err.code === 11000) {
      console.log(`[Scheduler] Lock already held or batch completed for ${lockId}. Skipping execution.`);
      return { skipped: true, reason: 'LOCK_ALREADY_ACQUIRED', lockId };
    }
    console.error(`[Scheduler] Error acquiring job lock: ${err.message}`);
    throw err;
  }

  // 2. Execute ROI service batch
  try {
    const summary = await processAllActiveInvestments(normalizedDate);

    // 3. Mark lock as COMPLETED
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
