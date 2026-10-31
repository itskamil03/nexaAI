const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Rate limiter for administrative triggers: 20 calls per 15 minutes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many administrative requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/roi/process', adminLimiter, adminController.triggerDailyRoi);

module.exports = router;
