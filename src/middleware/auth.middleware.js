const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklist.model.js');

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized: Token not provided"
            });
        }

        const isBlackListed = await blacklistModel.findOne({ token });
        if (isBlackListed) {
            return res.status(401).json({
                message: "Unauthorized: Token has been revoked"
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.user);
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized: User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Unauthorized: Token is invalid or expired"
            });
        }
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            message: "Internal Server Error during authorization"
        });
    }
}

async function authSystemMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized: Token not provided"
            });
        }

        const isBlackListed = await blacklistModel.findOne({ token });
        if (isBlackListed) {
            return res.status(401).json({
                message: "Unauthorized: Token has been revoked"
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.user).select("+systemUser");
        if (!user || !user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access: Not a system user"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Unauthorized: Token is invalid or expired"
            });
        }
        console.error("Auth system middleware error:", error);
        return res.status(500).json({
            message: "Internal Server Error during authorization"
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemMiddleware
};
