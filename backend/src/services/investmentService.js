const { Investment, User, WalletTransaction } = require('../models');
const { getPlanById } = require('../config/plans');
const { addDays } = require('../utils/dateUtils');
const { roundTo2Decimals } = require('../utils/mathPrecision');
const { distributeReferralIncome } = require('./referralService');

/**
 * Creates and activates an investment funded from user's internal wallet balance.
 *
 * @param {string|ObjectId} userId
 * @param {string} planId
 * @param {number} amount
 * @returns {Promise<object>} Created investment and updated user wallet balance
 */
const createInvestment = async (userId, planId, amount) => {
  const numAmount = roundTo2Decimals(Number(amount));

  // 1. Validate plan
  const plan = getPlanById(planId);
  if (!plan) {
    throw { statusCode: 400, message: `Invalid investment plan: "${planId}".` };
  }

  // 2. Validate amount against plan limits
  if (numAmount < plan.minAmount || numAmount > plan.maxAmount) {
    throw {
      statusCode: 422,
      message: `Amount $${numAmount} is outside allowed range ($${plan.minAmount} - $${plan.maxAmount}) for plan "${plan.name}".`,
    };
  }

  // 3. Check user and wallet balance
  const user = await User.findById(userId);
  if (!user) {
    throw { statusCode: 404, message: 'User not found.' };
  }

  if (user.accountStatus !== 'Active') {
    throw { statusCode: 403, message: 'Your account is not active for new investments.' };
  }

  if (user.walletBalance < numAmount) {
    throw {
      statusCode: 400,
      message: `Insufficient wallet balance ($${user.walletBalance.toFixed(2)}). Required: $${numAmount.toFixed(2)}. Please fund your wallet.`,
    };
  }

  // 4. Calculate tenure dates
  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);

  // 5. Create investment document
  const investment = new Investment({
    userId: user._id,
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

  await investment.save();

  // 6. Debit user wallet balance atomically
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { walletBalance: -numAmount } },
    { new: true }
  );

  // 7. Record debit in WalletTransaction audit ledger
  const idempotencyKey = `inv_debit:${investment._id}`;
  const debitTx = new WalletTransaction({
    userId: user._id,
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
  await debitTx.save();

  // 8. Distribute multi-tier referral rewards to uplines
  let referralCommissions = [];
  try {
    referralCommissions = await distributeReferralIncome(user._id, investment._id, numAmount);
  } catch (refErr) {
    console.error(`[InvestmentService] Error distributing referral income for inv ${investment._id}:`, refErr);
  }

  return {
    investment,
    walletBalance: updatedUser.walletBalance,
    referralCommissions,
  };
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
