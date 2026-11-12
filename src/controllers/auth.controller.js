const userModel = require("../models/user.model.js");
const jwt = require('jsonwebtoken');
const emailService = require("../services/email.service.js");
const blacklistModel = require("../models/blacklist.model.js");

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

async function userRegController(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                message: "Name is required",
                status: "failed"
            });
        }

        if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                message: "A valid email address is required",
                status: "failed"
            });
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
                status: "failed"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const isExists = await userModel.findOne({ email: normalizedEmail });

        if (isExists) {
            return res.status(422).json({
                message: "Email already exists",
                status: "failed"
            });
        }

        const user = await userModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password
        });

        const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });

        res.cookie("token", token, COOKIE_OPTIONS);
        res.status(201).json({
            message: "User Created Successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token
        });

        // Send registration email non-blockingly without throwing unhandled rejection
        emailService.sendRegistrationEmail(user.email, user.name).catch((err) => {
            console.error("Failed to send registration email:", err);
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Internal Server Error during registration"
        });
    }
}

async function userLogController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
            return res.status(400).json({
                message: "Email and password are required",
                status: "failed"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

        const validPassword = await user.comparePassword(password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

        const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.status(200).json({
            message: "Login successfull!!",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
            token
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal Server Error during login"
        });
    }
}

async function userLogoutController(req, res) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        res.clearCookie("token", COOKIE_OPTIONS);

        if (token) {
            await blacklistModel.updateOne({ token }, { token }, { upsert: true });
        }

        return res.status(200).json({
            message: "User Logged out Successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            message: "Internal Server Error during logout"
        });
    }
}

module.exports = {
    userRegController,
    userLogController,
    userLogoutController
};
