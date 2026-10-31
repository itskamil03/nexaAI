const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

router.get('/direct', protect, referralController.getDirectReferrals);
router.get('/tree', protect, referralController.getReferralTree);
router.get('/income', protect, referralController.getReferralIncomeHistory);

module.exports = router;
