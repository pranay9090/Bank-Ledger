const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token must be required"],
        unique: [true, "token must be unique"]
    }
}, { timestamps: true })

blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 })


const blacklistModel = mongoose.model("blacklist", blacklistSchema);
module.exports = blacklistModel