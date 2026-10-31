const { body } = require('express-validator');
const { handleValidationErrors } = require('./authValidator');

const createInvestmentValidator = [
  body('planId')
    .trim()
    .notEmpty()
    .withMessage('Plan ID is required'),
  body('amount')
    .notEmpty()
    .withMessage('Investment amount is required')
    .isFloat({ min: 10, max: 1000000 })
    .withMessage('Investment amount must be a number between $10.00 and $1,000,000.00'),
  handleValidationErrors,
];

const depositValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Deposit amount is required')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Deposit amount must be between $1.00 and $1,000,000.00'),
  handleValidationErrors,
];

module.exports = {
  createInvestmentValidator,
  depositValidator,
};
