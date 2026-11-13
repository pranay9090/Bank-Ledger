const express = require('express');
const userController = require("../controllers/auth.controller.js");
const { validate, registerSchema, loginSchema } = require("../middleware/validate.middleware.js");

const router = express.Router();

router.post('/register', validate(registerSchema), userController.userRegController);
router.post('/login', validate(loginSchema), userController.userLogController);
router.post('/logout', userController.userLogoutController);

module.exports = router;
