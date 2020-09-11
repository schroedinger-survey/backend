
import authorization from "../middleware/Authorization";
import validators from "../utils/Validators";
import tokenService from "../service/TokenService";
const express = require("express");


const tokenRouter = express.Router();

tokenRouter.post("/",
    authorization.securedPath,
    validators.createTokenValidationRules,
    validators.validate,
    tokenService.createToken);

tokenRouter.get("/",
    authorization.securedPath,
    validators.retrieveTokensValidationRules,
    validators.validate,
    tokenService.retrieveTokens);

tokenRouter.get("/count",
    authorization.securedPath,
    validators.retrieveTokensValidationRules,
    validators.validate,
    tokenService.countTokens);

tokenRouter.post("/email",
    authorization.securedPath,
    validators.createTokenAndSendEmailValidationRules,
    validators.validate,
    tokenService.createTokenAndSendEmail);

tokenRouter.delete("/:token_id",
    authorization.securedPath,
    tokenService.deleteUnusedToken);

export default tokenRouter;