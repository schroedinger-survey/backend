import authorizationMiddleware from "../middleware/AuthorizationMiddleware";
import validators from "../utils/Validators";
import tokenService from "../service/TokenService";
const express = require("express");


const tokenRouter = express.Router();

tokenRouter.post("/", authorizationMiddleware.securedPath, validators.createTokenValidationRules, validators.validate, tokenService.createToken);
tokenRouter.get("/", authorizationMiddleware.securedPath, validators.retrieveTokensValidationRules, validators.validate, tokenService.retrieveTokens);
tokenRouter.get("/count", authorizationMiddleware.securedPath, validators.retrieveTokensValidationRules, validators.validate, tokenService.countTokens);
tokenRouter.post("/email", authorizationMiddleware.securedPath, validators.createTokenAndSendEmailValidationRules, validators.validate, tokenService.createTokenAndSendEmail);
tokenRouter.delete("/:token_id", authorizationMiddleware.securedPath, tokenService.deleteUnusedToken);

export default tokenRouter;