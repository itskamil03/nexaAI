const mongoose = require('mongoose');
const { User, Investment, RoiHistory, WalletTransaction } = require('../models');
const { roundTo2Decimals } = require('../utils/mathPrecision');
const { normalizeDate, isDateEligible } = require('../utils/dateUtils');

/**
 * Calculates the daily ROI amount for a given investment.
 * Formula: amount * (dailyRoiPercentage / 100)
 *
 * @param {object} investment
 * @returns {number}
 */
const calculateInvestmentRoi = (investment) => {
  if (!investment || !investment.amount || !investment.dailyRoiPercentage) {
    return 0;
  }
  return roundTo2Decimals((investment.amount * investment.dailyRoiPercentage) / 100);
};

/**
 * Processes daily ROI for a single investment on a specified calendar date.
 * Fully idempotent: Safe against repeated execution for the same investment and date.
 *
 * @param {string|ObjectId} investmentId
 * @param {string|Date} [dateInput] - Defaults to current UTC date normalized to YYYY-MM-DD
 * @param {object} [session] - Optional Mongoose transaction session
 * @returns {Promise<object>} Processing outcome status and details
 */
const processInvestmentRoi = async (investmentId, dateInput = null, session = null) => {
  const normalizedDate = normalizeDate(dateInput);

  // 1. Fetch investment
  const investment = await Investment.findById(investmentId).session(session);
  if (!investment) {
    return {
      status: 'SKIPPED',
      reason: 'INVESTMENT_NOT_FOUND',
      investmentId,
      date: normalizedDate,
    };
  }

  // 2. Check investment status
  if (investment.status !== 'Active') {
    return {
      status: 'SKIPPED',
      reason: `INVESTMENT_STATUS_${investment.status.toUpperCase()}`,
      investmentId,
      date: normalizedDate,
    };
  }

  // 3. Check maturity: If target date is past endDate, mark Completed and skip
  const targetDateObj = new Date(`${normalizedDate}T00:00:00.000Z`);
  const endDateObj = new Date(investment.endDate);
  endDateObj.setUTCHours(23, 59, 59, 999);

  if (targetDateObj > endDateObj) {
    investment.status = 'Completed';
    await investment.save({ session });
    return {
      status: 'SKIPPED',
      reason: 'INVESTMENT_MATURED_AND_COMPLETED',
      investmentId,
      date: normalizedDate,
    };
  }

  // Check if investment has started
  const startDateObj = new Date(investment.startDate);
  startDateObj.setUTCHours(0, 0, 0, 0);
  if (targetDateObj < startDateObj) {
    return {
      status: 'SKIPPED',
      reason: 'INVESTMENT_NOT_YET_STARTED',
      investmentId,
      date: normalizedDate,
    };
  }

  // 4. Idempotency Check: Verify if ROI has already been processed for this date
  const idempotencyKey = `roi:${investment._id}:${normalizedDate}`;

  const existingRoi = await RoiHistory.findOne({
    investmentId: investment._id,
    date: normalizedDate,
  }).session(session);

  if (existingRoi) {
    return {
      status: 'SKIPPED',
      reason: 'ALREADY_PROCESSED',
      investmentId: investment._id,
      date: normalizedDate,
      roiAmount: existingRoi.roiAmount,
    };
  }

  // 5. Calculate ROI amount
  const roiAmount = calculateInvestmentRoi(investment);
  if (roiAmount <= 0) {
    return {
      status: 'SKIPPED',
      reason: 'ZERO_ROI_CALCULATED',
      investmentId: investment._id,
      date: normalizedDate,
    };
  }

  try {
    // 6. Create RoiHistory entry
    const roiRecord = new RoiHistory({
      userId: investment.userId,
      investmentId: investment._id,
      roiAmount,
      date: normalizedDate,
      status: 'Credited',
      processedAt: new Date(),
    });
    await roiRecord.save({ session });

    // 7. Atomically credit user's walletBalance and totalRoiEarned
    const updatedUser = await User.findByIdAndUpdate(
      investment.userId,
      {
        $inc: {
          walletBalance: roiAmount,
          totalRoiEarned: roiAmount,
        },
      },
      { new: true, session }
    );

    // 8. Create auditable WalletTransaction record
    const walletTx = new WalletTransaction({
      userId: investment.userId,
      transactionType: 'ROI_CREDIT',
      direction: 'CREDIT',
      amount: roiAmount,
      sourceRecordRef: 'RoiHistory',
      sourceRecordId: roiRecord._id,
      idempotencyKey,
      status: 'SUCCESS',
      description: `Daily ROI yield for investment (${investment.planDetails?.planName || 'Plan'}) - ${normalizedDate}`,
      balanceAfter: updatedUser ? updatedUser.walletBalance : null,
      timestamp: new Date(),
    });
    await walletTx.save({ session });

    return {
      status: 'CREDITED',
      investmentId: investment._id,
      userId: investment.userId,
      date: normalizedDate,
      roiAmount,
      idempotencyKey,
    };
  } catch (error) {
    // Handle duplicate key error code 11000 gracefully (concurrency race condition safeguard)
    if (error.code === 11000) {
      return {
        status: 'SKIPPED',
        reason: 'DUPLICATE_KEY_CONCURRENCY_PREVENTED',
        investmentId: investment._id,
        date: normalizedDate,
      };
    }
    throw error;
  }
};

/**
 * Batch processes daily ROI for all active investments for a given calendar date.
 * Reusable by both the node-cron scheduler and administrative manual trigger.
 *
 * @param {string|Date} [dateInput] - Normalized processing date (defaults to today)
 * @returns {Promise<object>} Execution summary metrics
 */
const processAllActiveInvestments = async (dateInput = null) => {
  const normalizedDate = normalizeDate(dateInput);
  const startTime = Date.now();

  console.log(`[RoiService] Starting daily ROI batch run for date: ${normalizedDate}`);

  // Find all active investments
  const activeInvestments = await Investment.find({
    status: 'Active',
  });

  const summary = {
    date: normalizedDate,
    totalActiveInvestments: activeInvestments.length,
    processedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    totalRoiAmount: 0.0,
    details: [],
    durationMs: 0,
  };

  for (const inv of activeInvestments) {
    try {
      const result = await processInvestmentRoi(inv._id, normalizedDate);
      if (result.status === 'CREDITED') {
        summary.processedCount++;
        summary.totalRoiAmount = roundTo2Decimals(summary.totalRoiAmount + result.roiAmount);
      } else {
        summary.skippedCount++;
      }
      summary.details.push(result);
    } catch (err) {
      summary.failedCount++;
      summary.details.push({
        status: 'FAILED',
        investmentId: inv._id,
        error: err.message,
      });
      console.error(`[RoiService] Failed processing ROI for investment ${inv._id}:`, err.message);
    }
  }

  summary.durationMs = Date.now() - startTime;
  console.log(
    `[RoiService] Finished batch for ${normalizedDate}: ` +
    `${summary.processedCount} credited ($${summary.totalRoiAmount}), ` +
    `${summary.skippedCount} skipped, ${summary.failedCount} failed in ${summary.durationMs}ms`
  );

  return summary;
};

module.exports = {
  calculateInvestmentRoi,
  processInvestmentRoi,
  processAllActiveInvestments,
};
