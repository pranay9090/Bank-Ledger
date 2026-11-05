const { Cookies } = require('nodemailer/lib/fetch');
const userModel = require('../models/user.model.js')

const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklist.model.js');


async function authMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unthorization token not found"
        })
    }

    const isBlackListed = await blacklistModel.findOne({ token });
    if (isBlackListed) {
        return res.status(401).json({
            message: "Unauthorized, Token not found(Blacklisted)"
        })
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.user)
        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Authorization Failed"
        })

    }
}

async function authSystemMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(404).json({
            message: "Token Not found"
        })
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.user).select("+systemUser");
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden acess, not a system user"
            })
        }

        req.user = user;
        next()

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })

    }

}

module.exports = {
    authMiddleware, authSystemMiddleware
}