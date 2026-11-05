const express = require('express');
const userController = require("../controllers/auth.controller.js")

const router = express.Router();

router.post('/register', userController.userRegController)
router.post('/login', userController.userLogController)
router.post('/logout', userController.userLogoutController)


module.exports = router