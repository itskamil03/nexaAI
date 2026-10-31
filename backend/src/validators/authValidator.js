const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return sendError(res, 'Validation error', 422, formattedErrors);
  }
  next();
};

const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .isLength({ min: 8, max: 20 })
    .withMessage('Please provide a valid mobile phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('referralCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Referral code must be valid alphanumeric characters'),
  handleValidationErrors,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  handleValidationErrors,
};
