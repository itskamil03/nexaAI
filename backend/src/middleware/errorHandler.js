const config = require('../config/env');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate record exists for ${field}: "${value}".`;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token provided.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Hide internal stack trace in production
  if (config.nodeEnv === 'development' && statusCode === 500) {
    console.error('[Error Details]', err);
  }

  return sendError(res, message, statusCode, errors);
};

const notFoundHandler = (req, res) => {
  return sendError(res, `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
