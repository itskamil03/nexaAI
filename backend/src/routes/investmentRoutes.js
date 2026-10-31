const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { createInvestmentValidator } = require('../validators/investmentValidator');
const { protect } = require('../middleware/authMiddleware');

// Public route to view configured plans
router.get('/plans', investmentController.getPlans);

// Protected investment operations
router.post('/', protect, createInvestmentValidator, investmentController.createInvestment);
router.get('/', protect, investmentController.getUserInvestments);
router.get('/:id', protect, investmentController.getInvestmentById);

module.exports = router;
