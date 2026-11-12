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
    }
}, { timestamps: true });

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function (session) {
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
    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance;
};

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;
