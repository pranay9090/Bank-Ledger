const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Account must be required for ledger"],
        ref: "account",
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Amonut must be required for ledger"],
        immutable: true,
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        index: true,
        immutable: true,
        required: [true, "transaction details must be required for ledger"]
    },
    type: {
        type: String,
        enum: {
            values: ["CREDIT", "DEBIT"],
            message: "ledger type can be either credit or debit"
        },
        required: [true, "Ledger type must be requied"],
        immutable: true
    }

}, { timestamps: true })


function preventLedgerModification() {
    throw new Error("Ledger entries are immutable they are cannot be modified or deleted")
}

ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);


const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel