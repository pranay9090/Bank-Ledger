const express = require('express');
const authMiddleware = require('../middleware/auth.middleware.js');
const transactionController = require('../controllers/transaction.controller.js');

const router = express.Router();

router.post('/', authMiddleware.authMiddleware, transactionController.createTransaction)
router.post('/system/initial-funds', authMiddleware.authSystemMiddleware, transactionController.createInitialTransactionFunds)
router.get('/', authMiddleware.authMiddleware, transactionController.getTransactions)


module.exports = router