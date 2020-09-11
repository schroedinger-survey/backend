import validators from "../utils/Validators";
import userServices from "../service/UserService";
import authorizationMiddleware from "../middleware/AuthorizationMiddleware";

const express = require("express");

const userRouter = express.Router();

userRouter.post("/", validators.userRegisterValidationRules, validators.validate, userServices.registerUser);
userRouter.put("/", authorizationMiddleware.securedPath, validators.userChangeInformationValidationRules, validators.validate, userServices.changeUserInformation);
userRouter.delete("/", authorizationMiddleware.securedPath, validators.userDeleteValidationRules, validators.validate, userServices.deleteUser);
userRouter.post("/login", validators.userLoginValidationRules, validators.validate, userServices.loginUser);
userRouter.post("/info", authorizationMiddleware.securedPath, userServices.userInfo);
userRouter.post("/logout", authorizationMiddleware.securedPath, userServices.userLogout);
userRouter.post("/password/reset", userServices.sendResetEmail);
userRouter.put("/password/reset", validators.userResetForgottenPasswordValidationRules, validators.validate, userServices.resetForgottenPassword);

export default userRouter;