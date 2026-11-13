const express = require('express');
const authMiddleware = require('../middleware/auth.middleware.js');
const transactionController = require('../controllers/transaction.controller.js');
const { validate, transferSchema, initialFundsSchema } = require('../middleware/validate.middleware.js');

const router = express.Router();

router.post('/', authMiddleware.authMiddleware, validate(transferSchema), transactionController.createTransaction);
router.post('/system/initial-funds', authMiddleware.authSystemMiddleware, validate(initialFundsSchema), transactionController.createInitialTransactionFunds);
router.get('/', authMiddleware.authMiddleware, transactionController.getTransactions);

module.exports = router;
