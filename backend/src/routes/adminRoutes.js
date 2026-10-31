const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/roi/process', adminController.triggerDailyRoi);

module.exports = router;
