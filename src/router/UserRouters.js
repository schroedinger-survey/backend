const express = require("express");
const {registerUser, loginUser} = require("../service/UserServices");
const {userRegisterValidationRules, userLoginValidationRules, validate} = require("../validator/UserValidators")


const userRouters = express.Router();

userRouters.post("/", userRegisterValidationRules, validate, registerUser);
userRouters.post("/login", userLoginValidationRules, validate, loginUser)

module.exports = userRouters;