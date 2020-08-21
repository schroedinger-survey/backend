const express = require("express");
const userServices = require("../service/UserService");
const {userRegisterValidationRules, userLoginValidationRules, validate} = require("../utils/Validators")


const userRouter = express.Router();

userRouter.post("/", userRegisterValidationRules, validate, userServices.registerUser);
userRouter.post("/login", userLoginValidationRules, validate, userServices.loginUser)

module.exports = userRouter;