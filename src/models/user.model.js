const mongoose = require("mongoose")
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required to create the account"],
        unique: [true, "Email already exists"],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, "Please enter a valid email"]
    },
    name: {
        type: String,
        required: [true, "Name is required to create the account"],
    },
    password: {
        type: String,
        required: [true, "Password is required to create the account"],
        minlength: [6, "Password must be atleast 6 characters long"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }


}, { timestamps: true })



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return;
    }
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return next;
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema);
module.exports = userModel 
