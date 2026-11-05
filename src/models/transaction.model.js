const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, 'Account must be associated with from account'],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, 'Account must be associated with to account'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FALIED", "REVERSED"],
            message: "Status can be either Pending, completed, failed or reversed"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "amount must be required for making transaction"],
        min: [0, "Amount should'nt be negative"]
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key must be required"],
        index: true,
        unique: true
    }
}, { timestamps: true })


const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel