import validators from "../utils/Validators";
import userServices from "../service/UserService";
import authorization from "../security/Authorization";
import {Router} from "express";

const userRouter = Router();

userRouter.post("/",
    validators.userRegisterValidationRules,
    validators.validate,
    userServices.registerUser);

userRouter.put("/",
    authorization.securedPath,
    validators.userChangeInformationValidationRules,
    validators.validate,
    userServices.changeUserInformation);

userRouter.delete("/",
    authorization.securedPath,
    validators.userDeleteValidationRules,
    validators.validate,
    userServices.deleteUser);

userRouter.post("/login",
    validators.userLoginValidationRules,
    validators.validate,
    userServices.loginUser);

userRouter.post("/info",
    authorization.securedPath,
    userServices.userInfo);

userRouter.post("/logout",
    authorization.securedPath,
    userServices.userLogout);

userRouter.post("/password/reset",
    userServices.sendResetEmail);

userRouter.put("/password/reset",
    validators.userResetForgottenPasswordValidationRules,
    validators.validate,
    userServices.resetForgottenPassword);

export default userRouter;