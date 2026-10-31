const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { depositValidator } = require('../validators/investmentValidator');
const { protect } = require('../middleware/authMiddleware');

router.get('/transactions', protect, walletController.getTransactions);
router.post('/deposit', protect, depositValidator, walletController.simulateDeposit);

module.exports = router;
