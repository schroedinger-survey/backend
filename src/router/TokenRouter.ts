
import authorization from "../middleware/Authorization";
import validators from "../utils/Validators";
import tokenService from "../service/TokenService";
import {Router} from "express";

const tokenRouter = Router();

tokenRouter.post("/",
    authorization.securedPath,
    validators.tokenCreateValidationRules,
    validators.validate,
    tokenService.createToken);

tokenRouter.get("/",
    authorization.securedPath,
    validators.tokenRetrieveValidationRules,
    validators.validate,
    tokenService.retrieveTokens);

tokenRouter.get("/count",
    authorization.securedPath,
    validators.tokenRetrieveValidationRules,
    validators.validate,
    tokenService.countTokens);

tokenRouter.post("/email",
    authorization.securedPath,
    validators.tokenCreateAndSendEmailValidationRules,
    validators.validate,
    tokenService.createTokenAndSendEmail);

tokenRouter.delete("/:token_id",
    authorization.securedPath,
    tokenService.deleteUnusedToken);

export default tokenRouter;