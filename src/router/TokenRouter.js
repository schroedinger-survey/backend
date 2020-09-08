const express = require("express");
const tokenService = require("../service/TokenService");
const {securedPath} = require("../middleware/AuthorizationMiddleware");
const {createTokenValidationRules, validate, createTokenAndSendEmailValidationRules} = require("../utils/Validators");


const tokenRouter = express.Router();

tokenRouter.post("/", securedPath, createTokenValidationRules, validate, tokenService.createToken);
tokenRouter.post("/email", securedPath, createTokenAndSendEmailValidationRules, validate, tokenService.createTokenAndSendEmail);

module.exports = tokenRouter;