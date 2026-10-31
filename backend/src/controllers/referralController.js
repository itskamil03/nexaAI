const referralService = require('../services/referralService');
const { ReferralIncome } = require('../models');
const { sendSuccess } = require('../utils/response');

/**
 * Fetch direct referrals (Level 1 downline)
 * GET /api/referrals/direct
 */
const getDirectReferrals = async (req, res, next) => {
  try {
    const directReferrals = await referralService.getDirectReferrals(req.user._id);
    return sendSuccess(
      res,
      { directReferrals, count: directReferrals.length },
      'Direct referrals retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch complete hierarchical referral tree
 * GET /api/referrals/tree
 */
const getReferralTree = async (req, res, next) => {
  try {
    const maxDepth = parseInt(req.query.maxDepth, 10) || 3;
    const tree = await referralService.getReferralTree(req.user._id, maxDepth);
    return sendSuccess(res, { tree }, 'Referral tree hierarchy retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch paginated referral income commission history
 * GET /api/referrals/income
 */
const getReferralIncomeHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    const [records, total] = await Promise.all([
      ReferralIncome.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sourceUserId', 'fullName email referralCode')
        .populate('sourceEventId', 'amount planDetails')
        .lean(),
      ReferralIncome.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      { records },
      'Referral income history retrieved successfully',
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDirectReferrals,
  getReferralTree,
  getReferralIncomeHistory,
};
