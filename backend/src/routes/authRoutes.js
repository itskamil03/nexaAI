const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiter for authentication routes: 50 requests per 15 mins (allows testing while preventing brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerValidator, authController.register);
router.post('/login', authLimiter, loginValidator, authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
