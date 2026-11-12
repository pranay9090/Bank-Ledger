const express = require('express');
const analyticsController = require('../controllers/analytics.controller.js')
const authMiddleware = require('../middleware/auth.middleware.js')


const router = express.Router();

router.get('/overview', authMiddleware.authMiddleware, analyticsController.getOverview);
router.get('/monthly', authMiddleware.authMiddleware, analyticsController.getMonthly);
router.get('/Daily', authMiddleware.authMiddleware, analyticsController.getDaily);
router.get('/accounts/:accountId', authMiddleware.authMiddleware, analyticsController.getStatement);

module.exports = router 