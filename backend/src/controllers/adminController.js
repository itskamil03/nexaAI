const { processAllActiveInvestments } = require('../services/roiService');
const { sendSuccess, sendError } = require('../utils/response');
const config = require('../config/env');

/**
 * Manually trigger daily ROI calculation for a target date
 * POST /api/admin/roi/process
 */
const triggerDailyRoi = async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;

    // Enforce administrative secret key verification
    if (adminSecret !== config.adminSecretKey && config.nodeEnv !== 'test') {
      return sendError(res, 'Unauthorized administrative access. Valid x-admin-secret header required.', 403);
    }

    const { processingDate } = req.body;
    const summary = await processAllActiveInvestments(processingDate);

    return sendSuccess(
      res,
      summary,
      `Daily ROI processed successfully for date ${summary.date}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerDailyRoi,
};
