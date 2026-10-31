const express = require('express');
const router = express.Router();
const roiController = require('../controllers/roiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, roiController.getRoiHistory);

module.exports = router;
