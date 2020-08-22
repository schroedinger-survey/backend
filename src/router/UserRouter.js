const express = require("express");
const userServices = require("../service/UserService");
const {securedPath} = require("../middleware/AuthorizationMiddleware");
const {userRegisterValidationRules, userLoginValidationRules, validate} = require("../utils/Validators")


const userRouter = express.Router();

userRouter.post("/", userRegisterValidationRules, validate, userServices.registerUser);
userRouter.post("/login", userLoginValidationRules, validate, userServices.loginUser);
userRouter.post("/info", securedPath, userServices.userInfo);
userRouter.post("/logout", securedPath, userServices.userLogout);

module.exports = userRouter;