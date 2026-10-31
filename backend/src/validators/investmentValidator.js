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
    .isFloat({ min: 10 })
    .withMessage('Investment amount must be a number greater than or equal to $10.00'),
  handleValidationErrors,
];

const depositValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Deposit amount is required')
    .isFloat({ min: 1 })
    .withMessage('Deposit amount must be at least $1.00'),
  handleValidationErrors,
];

module.exports = {
  createInvestmentValidator,
  depositValidator,
};
