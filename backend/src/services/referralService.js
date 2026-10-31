const mongoose = require('mongoose');
const { User, ReferralIncome, WalletTransaction, Investment } = require('../models');
const { REFERRAL_CONFIG, getCommissionRateForLevel } = require('../config/referral');
const { roundTo2Decimals } = require('../utils/mathPrecision');

/**
 * Distributes multi-tier referral income to uplines upon a qualifying investment.
 *
 * @param {string|ObjectId} sourceUserId - Investor who created the investment
 * @param {string|ObjectId} investmentId - The investment document ID
 * @param {number} investmentAmount - Monetary principal of the investment
 * @param {object} [session] - Optional Mongoose client session for transaction boundary
 * @returns {Promise<Array>} Array of distributed commission records
 */
const distributeReferralIncome = async (
  sourceUserId,
  investmentId,
  investmentAmount,
  session = null
) => {
  const distributed = [];
  const visitedUserIds = new Set(); // Prevent circular loops

  // 1. Fetch source user to find parent sponsor
  const sourceUser = await User.findById(sourceUserId).session(session);
  if (!sourceUser || !sourceUser.referredBy) {
    return distributed; // No upline sponsor
  }

  let currentParentId = sourceUser.referredBy;
  let currentLevel = 1;

  while (currentParentId && currentLevel <= REFERRAL_CONFIG.maxDepth) {
    const parentIdStr = currentParentId.toString();

    // Prevent cycle
    if (visitedUserIds.has(parentIdStr)) {
      console.warn(`[ReferralService] Circular referral loop detected at user ${parentIdStr}`);
      break;
    }
    visitedUserIds.add(parentIdStr);

    const parentUser = await User.findById(currentParentId).session(session);
    if (!parentUser) {
      break; // Parent not found, end traversal
    }

    // Check account eligibility
    const isEligible = !REFERRAL_CONFIG.requireActiveStatus || parentUser.accountStatus === 'Active';

    if (isEligible) {
      const percentage = getCommissionRateForLevel(currentLevel);
      const commissionAmount = roundTo2Decimals((investmentAmount * percentage) / 100);

      if (commissionAmount > 0) {
        const idempotencyKey = `ref:${investmentId}:L${currentLevel}:${parentUser._id}`;

        // Idempotency check: verify if commission has already been recorded
        const existingTx = await WalletTransaction.findOne({ idempotencyKey }).session(session);

        if (!existingTx) {
          // 1. Create ReferralIncome document
          const referralRecord = new ReferralIncome({
            userId: parentUser._id,
            sourceUserId: sourceUser._id,
            sourceEventId: investmentId,
            level: currentLevel,
            commissionPercentage: percentage,
            incomeAmount: commissionAmount,
            status: 'Credited',
            date: new Date(),
          });
          await referralRecord.save({ session });

          // 2. Atomically update parent user balances
          const updatedParent = await User.findByIdAndUpdate(
            parentUser._id,
            {
              $inc: {
                walletBalance: commissionAmount,
                totalLevelIncomeEarned: commissionAmount,
              },
            },
            { new: true, session }
          );

          // 3. Create audit WalletTransaction entry
          const walletTx = new WalletTransaction({
            userId: parentUser._id,
            transactionType: 'REFERRAL_CREDIT',
            direction: 'CREDIT',
            amount: commissionAmount,
            sourceRecordRef: 'ReferralIncome',
            sourceRecordId: referralRecord._id,
            idempotencyKey,
            status: 'SUCCESS',
            description: `Level ${currentLevel} referral commission from ${sourceUser.fullName} ($${investmentAmount} @ ${percentage}%)`,
            balanceAfter: updatedParent.walletBalance,
            timestamp: new Date(),
          });
          await walletTx.save({ session });

          distributed.push({
            level: currentLevel,
            beneficiaryId: parentUser._id,
            beneficiaryName: parentUser.fullName,
            percentage,
            commissionAmount,
            idempotencyKey,
          });
        }
      }
    }

    // Traverse to next upstream level
    currentParentId = parentUser.referredBy;
    currentLevel++;
  }

  return distributed;
};

/**
 * Retrieves direct referrals (Level 1 downline) for a given user.
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>}
 */
const getDirectReferrals = async (userId) => {
  const directUsers = await User.find({ referredBy: userId })
    .select('fullName email mobileNumber referralCode accountStatus createdAt')
    .lean();

  // Enhance each direct referral with total investment statistics
  const directReferralsWithStats = await Promise.all(
    directUsers.map(async (u) => {
      const investments = await Investment.find({ userId: u._id, status: { $ne: 'Cancelled' } })
        .select('amount status')
        .lean();

      const totalInvested = roundTo2Decimals(
        investments.reduce((sum, inv) => sum + inv.amount, 0)
      );

      const commissionsEarnedFromUser = await ReferralIncome.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), sourceUserId: u._id } },
        { $group: { _id: null, totalCommission: { $sum: '$incomeAmount' } } },
      ]);

      const commissionGenerated = commissionsEarnedFromUser.length > 0
        ? roundTo2Decimals(commissionsEarnedFromUser[0].totalCommission)
        : 0.0;

      return {
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        mobileNumber: u.mobileNumber,
        referralCode: u.referralCode,
        accountStatus: u.accountStatus,
        joinedAt: u.createdAt,
        totalInvested,
        commissionGenerated,
        activeInvestmentsCount: investments.filter(i => i.status === 'Active').length,
      };
    })
  );

  return directReferralsWithStats;
};

/**
 * Builds a complete hierarchical nested referral tree structure for a user.
 * Supports configurable maximum depth (default 3 levels).
 * @param {string|ObjectId} rootUserId
 * @param {number} [maxDepth=3]
 * @returns {Promise<object>} Nested tree representation
 */
const getReferralTree = async (rootUserId, maxDepth = 3) => {
  const rootUser = await User.findById(rootUserId)
    .select('fullName email referralCode accountStatus createdAt walletBalance')
    .lean();

  if (!rootUser) {
    return null;
  }

  // Recursive tree builder
  const buildSubtree = async (userId, currentDepth) => {
    if (currentDepth > maxDepth) {
      return [];
    }

    const children = await User.find({ referredBy: userId })
      .select('fullName email referralCode accountStatus createdAt')
      .lean();

    const childrenNodes = await Promise.all(
      children.map(async (child) => {
        // Fetch child investment summary
        const childInvestments = await Investment.find({
          userId: child._id,
          status: { $ne: 'Cancelled' },
        })
          .select('amount')
          .lean();

        const totalInvested = roundTo2Decimals(
          childInvestments.reduce((sum, i) => sum + i.amount, 0)
        );

        const grandChildren = await buildSubtree(child._id, currentDepth + 1);

        return {
          id: child._id,
          fullName: child.fullName,
          email: child.email,
          referralCode: child.referralCode,
          accountStatus: child.accountStatus,
          joinedAt: child.createdAt,
          level: currentDepth,
          totalInvested,
          childrenCount: grandChildren.length,
          children: grandChildren,
        };
      })
    );

    return childrenNodes;
  };

  const treeChildren = await buildSubtree(rootUser._id, 1);

  return {
    id: rootUser._id,
    fullName: rootUser.fullName,
    email: rootUser.email,
    referralCode: rootUser.referralCode,
    accountStatus: rootUser.accountStatus,
    level: 0,
    joinedAt: rootUser.createdAt,
    childrenCount: treeChildren.length,
    children: treeChildren,
  };
};

module.exports = {
  distributeReferralIncome,
  getDirectReferrals,
  getReferralTree,
};
