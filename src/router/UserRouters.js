const express = require("express");
const {registerUser} = require("../service/UserServices");
const { userRegisterValidationRules, validate } = require('../validator/UserValidators')


const userRouters = express.Router();

userRouters.post("/", userRegisterValidationRules, validate, registerUser);

module.exports = userRouters;