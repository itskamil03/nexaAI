const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

/**
 * Get comprehensive dashboard summary metrics and charts
 * GET /api/dashboard/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user._id);
    return sendSuccess(res, summary, 'Dashboard summary metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
};
