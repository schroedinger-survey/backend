const express = require("express");
const tokenService = require("../service/TokenService");
const {retrieveTokensValidationRules} = require("../utils/Validators");
const {securedPath} = require("../middleware/AuthorizationMiddleware");
const {createTokenValidationRules, validate, createTokenAndSendEmailValidationRules} = require("../utils/Validators");


const tokenRouter = express.Router();

tokenRouter.post("/", securedPath, createTokenValidationRules, validate, tokenService.createToken);
tokenRouter.get("/", securedPath, retrieveTokensValidationRules, validate, tokenService.retrieveTokens);
tokenRouter.get("/count", securedPath, retrieveTokensValidationRules, validate, tokenService.countTokens);
tokenRouter.post("/email", securedPath, createTokenAndSendEmailValidationRules, validate, tokenService.createTokenAndSendEmail);
tokenRouter.delete("/:token_id", securedPath, tokenService.deleteUnusedToken);

module.exports = tokenRouter;