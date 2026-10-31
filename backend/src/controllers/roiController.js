const { RoiHistory } = require('../models');
const { sendSuccess } = require('../utils/response');

/**
 * Fetch paginated daily ROI accrual history
 * GET /api/roi/history
 */
const getRoiHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.investmentId) {
      filter.investmentId = req.query.investmentId;
    }

    const [history, total] = await Promise.all([
      RoiHistory.find(filter)
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('investmentId', 'planDetails amount dailyRoiPercentage')
        .lean(),
      RoiHistory.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      { history },
      'ROI history retrieved successfully',
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
  getRoiHistory,
};
