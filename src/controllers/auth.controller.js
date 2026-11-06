const userModel = require("../models/user.model.js");
const jwt = require('jsonwebtoken')
const emailService = require("../services/email.service.js");
const blacklistModel = require("../models/blacklist.model.js");

async function userRegController(req, res) {
    const { name, email, password } = req.body;
    const isExists = await userModel.findOne({ email: email })

    if (isExists) {
        return res.status(422).json({
            message: "Email already Exists",
            status: "failed"
        })
    }

    const user = await userModel.create({ name, email, password });
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' })

    res.cookie("token", token);
    res.status(201).json({
        message: "User Created Successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token
    })
    await emailService.sendRegistrationEmail(user.email, user.name)
}

async function userLogController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password",
            status: "failed"
        })
    }

    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
        return res.status(401).json({
            message: "Invalid email or password",
            status: "failed"
        })
    }
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' })
    res.cookie("token", token)
    res.status(200).json({
        message: "Login successfull!!",
        user: {

            id: user._id,
            email: user.email,
            name: user.name,
        },
        token
    })

}

async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(200).json({
            message: "User Logged out Successfully"
        })
    }

    res.clearCookie("token");
    await blacklistModel.updateOne({ token }, { token }, { upsert: true });


    res.status(200).json({
        message: "User Logged out Successfully"
    })


}


module.exports = {
    userRegController,
    userLogController,
    userLogoutController
}
