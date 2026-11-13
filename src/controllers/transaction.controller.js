const mongoose = require('mongoose');
const accountModel = require('../models/account.model.js');
const ledgerModel = require('../models/ledger.model.js');
const transactionModel = require('../models/transaction.model.js');
const userModel = require('../models/user.model.js');
const emailService = require('../services/email.service.js');

async function createTransaction(req, res) {
    let session;
    try {
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        // 1. Validate required fields
        if (!fromAccount || !toAccount || typeof amount === 'undefined' || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount, toAccount, amount, and idempotencyKey are required"
            });
        }

        // 2. Validate amount is positive and finite
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number greater than 0"
            });
        }

        // 3. Validate Account ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(fromAccount) || !mongoose.Types.ObjectId.isValid(toAccount)) {
            return res.status(400).json({
                message: "Invalid account ID format"
            });
        }

        if (fromAccount.toString() === toAccount.toString()) {
            return res.status(400).json({
                message: "Self-transfers between identical accounts are not permitted"
            });
        }

        const fromUserAccount = await accountModel.findById(fromAccount);
        const toUserAccount = await accountModel.findById(toAccount);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "fromAccount or toAccount is invalid"
            });
        }

        if (fromUserAccount.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to transfer from this account"
            });
        }

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be active to complete the transfer"
            });
        }

        // 4. Validate Idempotency
        const existingTx = await transactionModel.findOne({ idempotencyKey });
        if (existingTx) {
            if (existingTx.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction Completed Successfully!!",
                    Transaction: existingTx
                });
            }
            if (existingTx.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                });
            }
            if (existingTx.status === "FAILED") {
                return res.status(400).json({
                    message: "Transaction previously failed. Please try with a new idempotencyKey"
                });
            }
            if (existingTx.status === "REVERSED") {
                return res.status(200).json({
                    message: "Transaction reversed!!"
                });
            }
        }

        // 5. ACID Transaction with document-level locking to prevent race conditions / double-spending
        session = await mongoose.startSession();
        session.startTransaction();

        // Lock the sender's account document inside the session by incrementing version
        const lockedFromAccount = await accountModel.findOneAndUpdate(
            { _id: fromAccount, status: "ACTIVE" },
            { $inc: { version: 1 } },
            { session, returnDocument: 'after' }
        );

        if (!lockedFromAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Sender account is no longer active"
            });
        }

        // Derive balance INSIDE the session to guarantee snapshot consistency
        const balance = await lockedFromAccount.getBalance(session);
        if (balance < numericAmount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: `Insufficient Balance. Current Balance: ${balance}, Amount to be paid: ${numericAmount}`
            });
        }

        const transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount: numericAmount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        await ledgerModel.create([{
            account: fromAccount,
            amount: numericAmount,
            type: "DEBIT",
            transaction: transaction._id
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: numericAmount,
            type: "CREDIT",
            transaction: transaction._id
        }], { session });

        // Atomically update materialized currentBalance on both accounts inside session
        await accountModel.updateOne(
            { _id: fromAccount },
            { $inc: { currentBalance: -numericAmount } },
            { session }
        );

        await accountModel.updateOne(
            { _id: toAccount },
            { $inc: { currentBalance: numericAmount } },
            { session }
        );

        const completedTransaction = await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session, returnDocument: 'after' }
        );

        await session.commitTransaction();

        // 6. Non-blocking email notification
        emailService.sendTransactionEmail(req.user.email, req.user.name, numericAmount, toAccount).catch((err) => {
            console.error("Failed to send transaction email:", err);
        });

        return res.status(200).json({
            message: "Transaction Completed Successfully!!",
            Transaction: completedTransaction
        });
    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        console.error("Transaction execution error:", error);
        return res.status(500).json({
            message: "Transaction Failed",
            error: error.message
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

async function createInitialTransactionFunds(req, res) {
    let session;
    try {
        const { toAccount, amount, idempotencyKey } = req.body;

        if (!toAccount || typeof amount === 'undefined' || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount, and idempotencyKey are required"
            });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number greater than 0"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(toAccount)) {
            return res.status(400).json({
                message: "Invalid toAccount ID format"
            });
        }

        const toUserAccount = await accountModel.findById(toAccount);
        if (!toUserAccount) {
            return res.status(404).json({
                message: "Recipient account not found"
            });
        }

        const existingTransaction = await transactionModel.findOne({ idempotencyKey });
        if (existingTransaction) {
            if (existingTransaction.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed successfully",
                    transaction: existingTransaction
                });
            }
            if (existingTransaction.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                });
            }
            if (existingTransaction.status === "FAILED") {
                return res.status(400).json({
                    message: "Transaction previously failed. Please try with a new idempotencyKey"
                });
            }
        }

        const systemUser = await userModel.findOne({ systemUser: true });
        if (!systemUser) {
            return res.status(404).json({ message: "System user not found" });
        }

        const fromUserAccount = await accountModel.findOne({ user: systemUser._id });
        if (!fromUserAccount) {
            return res.status(404).json({ message: "System user account not found" });
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const transaction = (await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount: numericAmount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: numericAmount,
            type: "DEBIT",
            transaction: transaction._id
        }], { session });

        await ledgerModel.create([{
            account: toAccount,
            amount: numericAmount,
            type: "CREDIT",
            transaction: transaction._id
        }], { session });

        // Initial funds: Atomically update materialized currentBalance on both accounts inside session
        await accountModel.updateOne(
            { _id: fromUserAccount._id },
            { $inc: { currentBalance: -numericAmount } },
            { session }
        );

        await accountModel.updateOne(
            { _id: toAccount },
            { $inc: { currentBalance: numericAmount } },
            { session }
        );

        const completedTransaction = await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session, returnDocument: 'after' }
        );

        await session.commitTransaction();

        return res.status(201).json({
            message: "Initial funds added successfully",
            transaction: completedTransaction
        });
    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        console.error("Initial funds error:", error);
        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
}

async function getTransactions(req, res) {
    try {
        const user = req.user;
        const account = await accountModel.findOne({ user: user._id });
        if (!account) {
            return res.status(200).json({ transactions: [] });
        }

        const ledgerEntries = await ledgerModel
            .find({ account: account._id })
            .populate('transaction')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            transactions: ledgerEntries
        });
    } catch (error) {
        console.error("Get transactions error:", error);
        return res.status(500).json({
            message: "Failed to fetch transactions"
        });
    }
}

module.exports = {
    createTransaction,
    createInitialTransactionFunds,
    getTransactions
};
