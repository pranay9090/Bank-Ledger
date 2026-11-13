const mongoose = require('mongoose');
const accountModel = require('../models/account.model.js');

async function createAccountController(req, res) {
    try {
        const user = req.user;

        // Idempotent check: return existing account if one already exists for this user
        let account = await accountModel.findOne({ user: user._id });
        if (account) {
            return res.status(200).json({
                message: "Account already exists",
                account
            });
        }

        account = await accountModel.create({
            user: user._id
        });

        return res.status(201).json({
            message: "Account Created!",
            account
        });
    } catch (error) {
        console.error("Create account error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getAccountController(req, res) {
    try {
        const user = req.user;

        const account = await accountModel.findOne({ user: user._id });
        if (account && (typeof account.currentBalance !== 'number' || account.currentBalance === 0)) {
            await account.syncBalance();
        }

        return res.status(200).json({
            message: "Your account is fetched!!",
            account
        });
    } catch (error) {
        console.error("Get account error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                message: "Invalid account ID format"
            });
        }

        const account = await accountModel.findOne({ _id: accountId, user: req.user._id });
        if (!account) {
            return res.status(404).json({
                message: "Account Not found"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            message: "Your Account Balance are fetched!!",
            balance,
            accountId: account._id
        });
    } catch (error) {
        console.error("Get account balance error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {
    createAccountController,
    getAccountController,
    getAccountBalanceController
};
