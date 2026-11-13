const mongoose = require('mongoose');
const ledgerModel = require('../models/ledger.model.js');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "account must be associated with the user"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Account must be either Active, frozen or closed",
        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        default: "INR"
    },
    version: {
        type: Number,
        default: 0
    },
    // Materialized running balance field for O(1) balance lookups
    currentBalance: {
        type: Number,
        default: 0,
        index: true
    }
}, { timestamps: true });

accountSchema.index({ user: 1, status: 1 });

/**
 * Reconciles and synchronizes the materialized currentBalance field against the immutable ledger
 * @param {import('mongoose').ClientSession} [session]
 */
accountSchema.methods.syncBalance = async function (session) {
    const aggregate = ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            }
        }
    ]);

    if (session) {
        aggregate.session(session);
    }

    const balanceData = await aggregate;
    const derivedBalance = balanceData.length === 0 ? 0 : balanceData[0].balance;

    this.currentBalance = derivedBalance;
    await this.save(session ? { session } : {});
    return derivedBalance;
};

/**
 * Returns current balance in O(1) time complexity using the materialized field
 * Falls back to full ledger aggregation if forceSync is explicitly requested
 * @param {import('mongoose').ClientSession} [session]
 * @param {boolean} [forceSync]
 */
accountSchema.methods.getBalance = async function (session, forceSync = false) {
    if (!forceSync && typeof this.currentBalance === 'number') {
        return this.currentBalance;
    }
    return await this.syncBalance(session);
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;
