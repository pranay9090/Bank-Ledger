const accountModel = require('../models/account.model.js')


async function createAccountController(req, res) {
    try {
        const user = req.user;

        const account = await accountModel.create({
            user: user._id
        })

        res.status(201).json({
            message: "Account Created!",
            account
        })




    }

    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
            error
        })

    }


}

async function getAccountController(req, res) {
    try {
        const user = req.user;

        const account = await accountModel.findOne({ user: user._id });

        res.status(200).json({
            message: "Your account is fetched!!",
            account
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
            error
        })

    }
}


async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;
        const account = await accountModel.findOne({ _id: accountId, user: req.user._id })
        if (!account) {
            return res.status(404).json({
                message: "Account Not found"
            })
        }
        const balance = await account.getBalance();

        res.status(200).json({
            "message": "Your Account Balance are fetched!!",
            balance,
            accountId: account._id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
            error
        })

    }

}
module.exports = { createAccountController, getAccountController, getAccountBalanceController }