const mongoose = require("mongoose");
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connection sucsessfull!!!!!")
    } catch (error) {
        console.log(`Database Connection Error:${error}`);
        process.exit(1)
    }
}

module.exports = connectDB;