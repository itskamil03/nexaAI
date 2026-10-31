const { Investment, User, WalletTransaction } = require('../models');
const { getPlanById } = require('../config/plans');
const { addDays } = require('../utils/dateUtils');
const { roundTo2Decimals } = require('../utils/mathPrecision');
const { distributeReferralIncome } = require('./referralService');
const { runInTransaction } = require('../utils/transaction');

/**
 * Creates and activates an investment funded from user's internal wallet balance.
 * Implements strict atomic conditional debit and multi-document ACID transactions on replica sets,
 * with compensating rollback protection on standalone deployments.
 *
 * @param {string|ObjectId} userId
 * @param {string} planId
 * @param {number} amount
 * @returns {Promise<object>} Created investment and updated user wallet balance
 */
const createInvestment = async (userId, planId, amount) => {
  const numAmount = roundTo2Decimals(Number(amount));

  // 1. Validate plan configuration
  const plan = getPlanById(planId);
  if (!plan) {
    throw { statusCode: 400, message: `Invalid investment plan: "${planId}".` };
  }

  // 2. Validate amount limits
  if (numAmount < plan.minAmount || numAmount > plan.maxAmount) {
    throw {
      statusCode: 422,
      message: `Amount $${numAmount.toFixed(2)} is outside allowed range ($${plan.minAmount} - $${plan.maxAmount}) for plan "${plan.name}".`,
    };
  }

  return runInTransaction(async (session) => {

  // 3. ATOMIC CONDITIONAL DEBIT:
  // Guarantees that concurrent requests cannot overdraft the balance below zero
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      walletBalance: { $gte: numAmount },
      accountStatus: 'Active',
    },
    {
      $inc: { walletBalance: -numAmount },
    },
    { new: true, session }
  );

  // If null, either insufficient balance, account inactive, or user not found
  if (!updatedUser) {
    const existingUser = await User.findById(userId).session(session);
    if (!existingUser) {
      throw { statusCode: 404, message: 'User not found.' };
    }
    if (existingUser.accountStatus !== 'Active') {
      throw { statusCode: 403, message: 'Your account is not active for new investments.' };
    }
    throw {
      statusCode: 400,
      message: `Insufficient wallet balance ($${existingUser.walletBalance.toFixed(2)}). Required: $${numAmount.toFixed(2)}. Please fund your wallet.`,
    };
  }

  // 4. Calculate tenure dates
  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  let investment;
  try {
    // 5. Create investment record
    investment = new Investment({
      userId: updatedUser._id,
      amount: numAmount,
      planDetails: {
        planId: plan.planId,
        planName: plan.name,
        durationDays: plan.durationDays,
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
      },
      startDate,
      endDate,
      dailyRoiPercentage: plan.dailyRoiPercentage,
      status: 'Active',
    });
    await investment.save({ session });

    // 6. Record debit in WalletTransaction audit ledger
    const idempotencyKey = `inv_debit:${investment._id}`;
    const debitTx = new WalletTransaction({
      userId: updatedUser._id,
      transactionType: 'INVESTMENT_DEBIT',
      direction: 'DEBIT',
      amount: numAmount,
      sourceRecordRef: 'Investment',
      sourceRecordId: investment._id,
      idempotencyKey,
      status: 'SUCCESS',
      description: `Principal investment in ${plan.name} (${plan.durationDays} days @ ${plan.dailyRoiPercentage}% daily ROI)`,
      balanceAfter: updatedUser.walletBalance,
      timestamp: new Date(),
    });
    await debitTx.save({ session });
  } catch (err) {
    // COMPENSATING ROLLBACK: Restore debited funds if investment or ledger creation failed on standalone
    console.error(`[InvestmentService] Rolling back debited funds for user ${userId} due to write failure:`, err.message);
    try {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: numAmount } });
      if (investment && investment._id) {
        await Investment.findByIdAndDelete(investment._id);
      }
    } catch (rollbackErr) {
      console.error('[InvestmentService] CRITICAL: Failed to execute rollback compensation:', rollbackErr);
    }
    throw err;
  }

  // 7. Distribute multi-tier referral rewards to uplines
  let referralCommissions = [];
  try {
    referralCommissions = await distributeReferralIncome(updatedUser._id, investment._id, numAmount, session);
  } catch (refErr) {
    console.error(`[InvestmentService] Error distributing referral income for inv ${investment._id}:`, refErr);
  }

  return {
    investment,
    walletBalance: updatedUser.walletBalance,
    referralCommissions,
  };
  });
};

/**
 * Lists investments belonging to a specific user with filtering and pagination.
 */
const getUserInvestments = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { userId };
  if (query.status && ['Active', 'Completed', 'Cancelled'].includes(query.status)) {
    filter.status = query.status;
  }

  const [investments, totalCount, activeAgg] = await Promise.all([
    Investment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Investment.countDocuments(filter),
    Investment.aggregate([
      { $match: { userId, status: 'Active' } },
      { $group: { _id: null, totalActive: { $sum: '$amount' } } },
    ]),
  ]);

  const activeAmount = activeAgg.length > 0 ? roundTo2Decimals(activeAgg[0].totalActive) : 0.0;

  return {
    investments,
    totalCount,
    activeAmount,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
};

/**
 * Retrieves a single investment ensuring the requesting user owns it.
 */
const getInvestmentById = async (investmentId, userId) => {
  const investment = await Investment.findOne({ _id: investmentId, userId }).lean();
  if (!investment) {
    throw { statusCode: 404, message: 'Investment not found or access denied.' };
  }
  return investment;
};

module.exports = {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
};
