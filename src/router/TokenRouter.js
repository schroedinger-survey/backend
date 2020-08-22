const express = require("express");
const tokenService = require("../service/TokenService");
const {securedPath} = require("../middleware/AuthorizationMiddleware");
const {createTokenValidationRules, validate} = require("../utils/Validators");


const tokenRouter = express.Router();

tokenRouter.post("/", securedPath, createTokenValidationRules, validate, tokenService.createToken);

module.exports = tokenRouter;