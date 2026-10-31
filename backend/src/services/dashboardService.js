const mongoose = require('mongoose');
const { User, Investment, RoiHistory, ReferralIncome } = require('../models');
const { roundTo2Decimals } = require('../utils/mathPrecision');
const { normalizeDate, addDays } = require('../utils/dateUtils');

/**
 * Aggregates all authoritative dashboard metrics for an authenticated user.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<object>} Complete dashboard state
 */
const getDashboardSummary = async (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const todayStr = normalizeDate();

  // 1. Fetch fresh user data
  const user = await User.findById(userObjId)
    .select('walletBalance totalRoiEarned totalLevelIncomeEarned referralCode accountStatus')
    .lean();

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  // 2. Fetch active investments to calculate totalInvestments and dailyExpectedRoi
  const activeInvestments = await Investment.find({
    userId: userObjId,
    status: 'Active',
  }).lean();

  const totalInvestments = roundTo2Decimals(
    activeInvestments.reduce((sum, inv) => sum + inv.amount, 0)
  );

  const dailyExpectedRoi = roundTo2Decimals(
    activeInvestments.reduce(
      (sum, inv) => sum + (inv.amount * inv.dailyRoiPercentage) / 100,
      0
    )
  );

  // 3. Calculate today's actual credited ROI
  const todayRoiAgg = await RoiHistory.aggregate([
    { $match: { userId: userObjId, date: todayStr, status: 'Credited' } },
    { $group: { _id: null, total: { $sum: '$roiAmount' } } },
  ]);
  const todayRoiEarned = todayRoiAgg.length > 0 ? roundTo2Decimals(todayRoiAgg[0].total) : 0.0;

  // 4. Count direct referrals
  const directReferralsCount = await User.countDocuments({ referredBy: userObjId });

  // 5. Recent ROI History (top 5)
  const recentRoiHistory = await RoiHistory.find({ userId: userObjId })
    .sort({ processedAt: -1 })
    .limit(5)
    .populate('investmentId', 'planDetails amount')
    .lean();

  // 6. Recent Referral Income (top 5)
  const recentReferralIncome = await ReferralIncome.find({ userId: userObjId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('sourceUserId', 'fullName email')
    .lean();

  // 7. Generate 7-day earnings time series for Recharts
  const chartDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    chartDays.push(normalizeDate(d));
  }

  // Aggregate past 7 days ROI
  const pastRoiAgg = await RoiHistory.aggregate([
    {
      $match: {
        userId: userObjId,
        date: { $in: chartDays },
        status: 'Credited',
      },
    },
    {
      $group: {
        _id: '$date',
        roiTotal: { $sum: '$roiAmount' },
      },
    },
  ]);

  const roiMap = new Map();
  pastRoiAgg.forEach(item => roiMap.set(item._id, item.roiTotal));

  // Aggregate past 7 days referral income
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const pastRef = await ReferralIncome.find({
    userId: userObjId,
    createdAt: { $gte: sevenDaysAgo },
    status: 'Credited',
  }).lean();

  const refMap = new Map();
  pastRef.forEach(item => {
    const dStr = normalizeDate(item.createdAt);
    refMap.set(dStr, (refMap.get(dStr) || 0) + item.incomeAmount);
  });

  const earningsChartData = chartDays.map(dateStr => {
    const roi = roundTo2Decimals(roiMap.get(dateStr) || 0);
    const referral = roundTo2Decimals(refMap.get(dateStr) || 0);
    return {
      date: dateStr.slice(5), // 'MM-DD' for cleaner chart labels
      fullDate: dateStr,
      roi,
      referral,
      total: roundTo2Decimals(roi + referral),
    };
  });

  return {
    metrics: {
      totalInvestments,
      dailyExpectedRoi,
      todayRoiEarned,
      totalRoiEarned: roundTo2Decimals(user.totalRoiEarned || 0),
      totalLevelIncomeEarned: roundTo2Decimals(user.totalLevelIncomeEarned || 0),
      walletBalance: roundTo2Decimals(user.walletBalance || 0),
      activeInvestmentsCount: activeInvestments.length,
      directReferralsCount,
    },
    recentRoiHistory,
    recentReferralIncome,
    earningsChartData,
  };
};

module.exports = {
  getDashboardSummary,
};
