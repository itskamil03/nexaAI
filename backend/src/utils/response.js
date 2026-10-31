/**
 * Standardized API Response Envelopes
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = Array.isArray(errors) ? errors : [errors];
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
