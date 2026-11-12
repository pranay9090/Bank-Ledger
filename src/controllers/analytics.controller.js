const mongoose = require('mongoose');
const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');

async function getOverview(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id });
        const accountIds = userAccounts.map(acc => acc._id);

        if (accountIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalCredits: 0,
                    totalDebits: 0,
                    totalTransactions: 0,
                    creditCount: 0,
                    debitCount: 0
                }
            });

        }

        const stats = await ledgerModel.aggregate([
            {
                $match: {
                    account: { $in: accountIds }
                }
            }, {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                        }
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                        }
                    },
                    creditCount: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "CREDIT"] }, 1, 0]
                        }
                    },
                    debitCount: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEBIT"] }, 1, 0]
                        }
                    },
                    totalTransactions: { $sum: 1 }
                }
            }, {
                $project: {
                    _id: 0,
                    totalCredits: 1,
                    totalDebits: 1,
                    totalTransactions: 1,
                    creditCount: 1,
                    debitCount: 1
                }
            }
        ])
        const data = stats[0] || {
            totalCredits: 0,
            totalDebits: 0,
            totalTransactions: 0,
            creditCount: 0,
            debitCount: 0
        };

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Error in getOverview analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }

}


async function getMonthly(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id });
        const accountIds = userAccounts.map(acc => acc._id);

        if (accountIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });

        }

        const MonthlyData = await ledgerModel.aggregate([
            {
                $match: {
                    account: { $in: accountIds }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$createdAt"
                        }
                    },
                    credits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                        }
                    },
                    debits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                        }
                    }

                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    credits: 1,
                    debits: 1
                }
            }
        ])
        return res.status(200).json({
            success: true,
            data: MonthlyData
        });



    } catch (error) {
        console.error("Error in getMontly analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
async function getDaily(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id });
        const accountIds = userAccounts.map(acc => acc._id);

        if (accountIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });

        }

        const DailyData = await ledgerModel.aggregate([
            {
                $match: {
                    account: { $in: accountIds }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    credits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                        }
                    },
                    debits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                        }
                    }

                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    credits: 1,
                    debits: 1
                }
            }
        ])
        return res.status(200).json({
            success: true,
            data: DailyData
        });



    } catch (error) {
        console.error("Error in getDaily analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getStatement(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({ _id: accountId, user: req.user._id });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        const StatementData = await ledgerModel.aggregate([
            {
                $match: {
                    account: account._id
                }
            },
            {
                $addFields: {
                    signedAmount: {
                        $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", { $multiply: ["$amount", -1] }]
                    }
                }
            },
            {
                $setWindowFields: {
                    sortBy: { createdAt: 1, _id: 1 },
                    output: {
                        balanceAfter: {
                            $sum: "$signedAmount",
                            window: { documents: ["unbounded", "current"] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    type: 1,
                    amount: 1,
                    balanceAfter: 1
                }
            }
        ])

        return res.status(200).json({
            success: true,
            data: StatementData
        });

    } catch (error) {
        console.error("Error in getStatement analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = { getOverview, getMonthly, getDaily, getStatement }