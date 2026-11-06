const accountModel = require('../models/account.model.js');
const ledgerModel = require('../models/ledger.model.js');
const transactionModel = require('../models/transaction.model.js');
const userModel = require('../models/user.model.js');
const emailService = require('../services/email.service.js');
const mongoose = require('mongoose')



async function createTransaction(req, res) {
    let session;
    try {
        // 1.Validating request
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "fromAccount,toAccount,amount,idempotencyKey are must be required"
            })
        }

        if (fromAccount === toAccount) {
            return res.status(400).json({
                message: "Self-transfers between identical accounts are not permitted"
            });
        }

        const fromUserAccount = await accountModel.findById(fromAccount);

        const toUserAccount = await accountModel.findById(toAccount);

        // console.log("FromAccount:", fromUserAccount);
        // console.log("toAccount:", toUserAccount);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "fromAccount or toAccount is invalid"
            })
        }

        if (fromUserAccount.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to transfer from this account"
            });
        }

        // 2.validating Idempotency

        const isIdempotencyKeyExists = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        })

        if (isIdempotencyKeyExists) {
            if (isIdempotencyKeyExists.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction Completed Successfully!!"
                })
            }
            if (isIdempotencyKeyExists.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                })
            }
            if (isIdempotencyKeyExists.status === "FAILED") {
                return res.status(200).json({
                    message: "Transaction Failed, Pleasae Try again"
                })
            }

            if (isIdempotencyKeyExists.status === "REVERSED") {
                return res.status(200).json({
                    message: "Transaction reversed!!"
                })
            }

        }

        // 3. check account status

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be 'acive' to make the transaction"
            })
        }

        // 4. Deriving sender Account balance

        const balance = await fromUserAccount.getBalance();
        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient Balance. Current Balance: ${balance}, Amount to be paid: ${amount}`
            })
        }


        // 5. Create Transaction status 'PENDING'

        session = await mongoose.startSession();
        session.startTransaction();


        const transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
        }], { session }))[0]

        const debitLedgerRecord = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            type: "DEBIT",
            transaction: transaction._id

        }], { session })

        const creditLedgerRecord = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            type: "CREDIT",
            transaction: transaction._id

        }], { session })

        const completedTransaction = await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session, new: true }
        );

        await session.commitTransaction();

        // 10. Sending email Notification
        try {
            emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount).catch((err) => {
                console.error("Failed to send transaction email:", err);
            });
        } catch (emailErr) {
            console.error("Error initiating transaction email:", emailErr);
        }

        return res.status(200).json({
            message: "Transaction Completed Successfully!!",
            Transaction: completedTransaction
        });
    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }

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

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount,amount and idempotencyKey are requied"
            })
        }

        const toUserAccount = await accountModel.findOne({
            _id: toAccount
        })


        if (!toUserAccount) {
            return res.status(404).json({
                message: "toUser Account Not found"
            })
        }

        // 1. Check if idempotencyKey already exists
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

        // const fromUserAccount = await accountModel.findOne({
        //     systemUser: true,
        //     user: req.user._id
        // })

        // Step 1: Find the system user in the users collection
        const systemUser = await userModel.findOne({ systemUser: true });
        if (!systemUser) {
            return res.status(404).json({ message: "System user not found" });
        }
        // Step 2: Find the account belonging to that system user
        const fromUserAccount = await accountModel.findOne({ user: systemUser._id });
        if (!fromUserAccount) {
            return res.status(404).json({ message: "System user account not found" });
        }






        if (!fromUserAccount) {
            return res.status(404).json({
                message: "fromUserAccount Not found"
            })
        }


        session = await mongoose.startSession();
        session.startTransaction();


        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
        })

        const debitLedgerRecord = await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            type: "DEBIT",
            transaction: transaction._id

        }], { session })

        const creditLedgerRecord = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            type: "CREDIT",
            transaction: transaction._id

        }], { session })


        transaction.status = "COMPLETED";
        await transaction.save({ session })

        await session.commitTransaction()

        return res.status(201).json({
            message: "Initial funds added successfully",
            transaction
        });

    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
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
        return res.status(500).json({
            message: "Failed to fetch transactions",
            error: error.message
        });
    }
}

module.exports = { createTransaction, createInitialTransactionFunds, getTransactions }