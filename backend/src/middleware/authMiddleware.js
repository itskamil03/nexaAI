const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { User } = require('../models');

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'The user belonging to this token no longer exists.', 401);
    }

    if (user.accountStatus === 'Suspended') {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token. Please authenticate again.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Your session has expired. Please log in again.', 401);
    }
    return sendError(res, 'Authentication failed.', 401);
  }
};

module.exports = { protect };
