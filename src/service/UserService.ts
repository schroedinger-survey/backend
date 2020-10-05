import postgresDB from "../data/drivers/PostgresDB";
import userDB from "../data/sql/UserDB";
import forgotPasswordDB from "../data/sql/ForgotPasswordTokenDB";
import ForgotPasswordEmail from "../models/mail/ForgotPasswordEmail";
import passwordHasher from "../utils/PasswordHasher";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";
import Context from "../utils/Context";
import {Request, Response} from "express";
import {UnknownError} from "../errors/UnknownError";
import UserNotFoundError from "../errors/UserNotFoundError";
import EmailOrUsernameIsTakenError from "../errors/EmailOrUsernameIsTakenError";
import EmailOrUsernameIsExpectedError from "../errors/EmailOrUsernameIsExpectedError";
import ResetPasswordLinkNotFoundError from "../errors/ResetPasswordLinkNotFoundError";
import emailMessageQueue from "../data/queue/EmailMessageQueue";

const log = loggerFactory.buildDebugLogger("src/service/UserService.js");

class UserService {
    deleteUser = async (req: Request, res: Response) => {
        Context.setMethod("deleteUser");
        const userId = req["schroedinger"].user.id;
        const password = req.body.password;
        log.warn(`User with ID ${userId} wants to delete account`);
        try {
            await postgresDB.begin();
            const query = await userDB.getUserByIdUnsecured(userId);
            if (query.length !== 1) {
                return res["schroedinger"].error(new UserNotFoundError());
            }
            const user = query[0];
            if (await passwordHasher.validate(password, user.hashed_password) !== true) {
                log.debug("Old password does not match.");
                await postgresDB.rollback();
                return res["schroedinger"].error(new UserNotFoundError());
            }
            await userDB.deleteUserById(userId);
            log.warn("User deleted account");
            return res.status(200).send("Account was deleted successfully");
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res["schroedinger"].error(new UnknownError(e.message, "Delete user"));
        }
    }

    userLogout = async (req: Request, res: Response) => {
        Context.setMethod("userLogout");
        log.debug("User want to log out");
        try {
            await userDB.logout(req["schroedinger"].user.id);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Logout user"));
        }
    }

    userInfo = async (req: Request, res: Response) => {
        Context.setMethod("userInfo");
        const userId = req["schroedinger"].user.id;
        try {
            const result = await userDB.getUserById(userId);
            if (result.length === 1) {
                const user = result[0];
                return res.status(200).send({
                    "id": userId,
                    "username": user.username,
                    "email": user.email,
                    "last_edited": user.last_edited,
                    "last_changed_password": user.last_changed_password,
                    "created": user.created
                });
            }
            return res["schroedinger"].error(new UserNotFoundError());
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "User's information"));
        }
    }

    registerUser = async (req: Request, res: Response) => {
        Context.setMethod("registerUser");
        log.debug("New user want to register");
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        const hashed_password = await passwordHasher.encrypt(password);
        try {
            await postgresDB.begin();

            const usersByUsername = await userDB.getUserByUserNameUnsecured(username);
            if (usersByUsername.length !== 0) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new EmailOrUsernameIsTakenError("Username is taken.", "Register user."));
            }

            const usersByEmail = await userDB.getUserByEmailUnsecured(email);
            if (usersByEmail.length !== 0) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new EmailOrUsernameIsTakenError("Email is taken.", "Register user."));
            }

            const result = await userDB.register(username, hashed_password, email);
            if (result.length === 1) {
                await postgresDB.commit();
                return res.sendStatus(201);
            }
            await postgresDB.rollback();
            return res["schroedinger"].error(new UnknownError("Database return 0 created user", "Create user"));
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res["schroedinger"].error(new UnknownError(e.message, "Create user"));
        }
    }

    loginUser = async (req: Request, res: Response) => {
        Context.setMethod("loginUser");
        log.debug("User want to login");
        const {username, password} = req.body;
        try {
            const result = await userDB.getUserByUsernameOrEmail(username);
            if (result.length === 1) {
                const user = result[0];
                const hashed_password = user.hashed_password;
                const id = user.id;
                const matchingPassword = await passwordHasher.validate(password, hashed_password);

                if (matchingPassword) {
                    const token = jsonWebToken.sign({
                        id: id,
                        username: username,
                        last_changed_password: user.last_changed_password,
                        user_created_at: new Date(user.created).getTime() / 1000
                    });
                    return res.status(200).send({"jwt": token});
                }
                return res["schroedinger"].error(new UserNotFoundError());
            }
            return res["schroedinger"].error(new UserNotFoundError());
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Login user"));
        }
    }

    changeUserInformation = async (req: Request, res: Response) => {
        Context.setMethod("changeUserInformation");
        log.debug("User want to change credentials and other information");

        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password ? req.body.new_password : null;
        const newEmail = req.body.email ? req.body.email : null;
        const newUsername = req.body.username ? req.body.username : null;
        const userId = req["schroedinger"].user.id;

        try {
            await postgresDB.begin("REPEATABLE READ");
            log.debug("Check if username and email are available");
            const checkIfEmailAndUsernamesAreFree = [];
            if (newEmail) {
                checkIfEmailAndUsernamesAreFree.push(userDB.getUserByEmailUnsecured(newEmail));
            }
            if (newUsername) {
                checkIfEmailAndUsernamesAreFree.push(userDB.getUserByUserNameUnsecured(newUsername));
            }
            const results = await Promise.all(checkIfEmailAndUsernamesAreFree);
            log.debug(`Result of email and username check return ${results.length} rows`);
            if (newEmail) {
                const emailStillFree = results[0];
                results.shift();
                if (emailStillFree.length === 1) {
                    await postgresDB.rollback();
                    return res["schroedinger"].error(new EmailOrUsernameIsTakenError("Email is taken.", "Register user."));
                }
                log.debug("Email is available");
            }
            if (newUsername) {
                const nameStillFree = results[0];
                results.shift();
                if (nameStillFree.length === 1) {
                    await postgresDB.rollback();
                    return res["schroedinger"].error(new EmailOrUsernameIsTakenError("Username is taken.", "Register user."));
                }
                log.debug("Username is available");
            }

            const getUserQuery = await userDB.getUserByIdUnsecured(userId);
            log.debug(`Querying user with ID ${userId} returns ${getUserQuery}`);
            if (getUserQuery.length !== 1) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new UserNotFoundError());
            }
            const user = getUserQuery[0];
            if (await passwordHasher.validate(oldPassword, user.hashed_password) !== true) {
                log.debug("Old password does not match.");
                await postgresDB.rollback();
                return res["schroedinger"].error(new UserNotFoundError());
            }
            let newPasswordHash = null;
            if (newPassword) {
                newPasswordHash = await passwordHasher.encrypt(newPassword);
            }
            const changeUserInformationQuery = await userDB.changeUserInformation(userId, newUsername, newEmail, newPasswordHash, user.username, user.email, user.hashed_password);
            if (changeUserInformationQuery.length !== 1) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new UnknownError("Database returns 0 changed user", "Change user"));
            }
            await postgresDB.commit();
            return res.sendStatus(204);
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Change user"));
        }
    }

    sendResetEmail = async (req: Request, res: Response) => {
        Context.setMethod("sendResetEmail");
        if (!req.body) {
            return res["schroedinger"].error(new EmailOrUsernameIsExpectedError("Send reset email"));
        }
        const username = req.body.username ? req.body.username : null;
        const emailAddress = req.body.email ? req.body.email : null;
        try {
            await postgresDB.begin();
            const sendMail = async (user: any) => {
                const forgotPasswordToken = await forgotPasswordDB.createForgotPasswordToken(user.id);
                await postgresDB.commit();
                const resetEmail = new ForgotPasswordEmail(emailAddress, {
                    username: user.username,
                    token: forgotPasswordToken[0].id
                });
                await emailMessageQueue.publishEmails([resetEmail]);
                log.info(`Sent following email for password resetting ${JSON.stringify(resetEmail)}`);
                return res.status(200).send(`A reset email was sent to the address ${emailAddress}`);
            }

            if (emailAddress) {
                const query = await userDB.getUserByEmailUnsecured(emailAddress);
                if (query.length === 1) {
                    const user = query[0];
                    return await sendMail(user);
                }
            }else if (username) {
                const query = await userDB.getUserByUserNameUnsecured(username);
                if (query.length === 1) {
                    const user = query[0];
                    return await sendMail(user);
                }
            }
            await postgresDB.rollback();
            return res["schroedinger"].error(new EmailOrUsernameIsExpectedError("Send reset email"));
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Publish password resetting emails"));
        }
    }

    resetForgottenPassword = async (req: Request, res: Response) => {
        Context.setMethod("resetForgottenPassword");
        const reset_password_token = req.body.reset_password_token;
        const new_password = req.body.new_password;
        try {
            const hashed_password = await passwordHasher.encrypt(new_password);
            const result = await forgotPasswordDB.changeUserPassword(reset_password_token, hashed_password);
            if(result.length !== 1){
                return res["schroedinger"].error(new ResetPasswordLinkNotFoundError())
            }
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Reset forgotten password"));
        }
    }
}

const userServices = new UserService();
export default userServices;