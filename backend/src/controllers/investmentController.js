const investmentService = require('../services/investmentService');
const { INVESTMENT_PLANS } = require('../config/plans');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get available investment plans
 * GET /api/investments/plans
 */
const getPlans = (req, res) => {
  return sendSuccess(res, { plans: INVESTMENT_PLANS }, 'Investment plans retrieved successfully');
};

/**
 * Create a new investment
 * POST /api/investments
 */
const createInvestment = async (req, res, next) => {
  try {
    const { planId, amount } = req.body;
    const result = await investmentService.createInvestment(req.user._id, planId, amount);

    return sendSuccess(
      res,
      result,
      'Investment created and activated successfully',
      201
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * View authenticated user investments
 * GET /api/investments
 */
const getUserInvestments = async (req, res, next) => {
  try {
    const result = await investmentService.getUserInvestments(req.user._id, req.query);
    return sendSuccess(
      res,
      result,
      'User investments retrieved successfully',
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * View single investment detail
 * GET /api/investments/:id
 */
const getInvestmentById = async (req, res, next) => {
  try {
    const investment = await investmentService.getInvestmentById(req.params.id, req.user._id);
    return sendSuccess(res, { investment }, 'Investment detail retrieved successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

module.exports = {
  getPlans,
  createInvestment,
  getUserInvestments,
  getInvestmentById,
};
