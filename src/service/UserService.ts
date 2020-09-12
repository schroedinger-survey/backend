import postgresDB from "../drivers/PostgresDB";
import userDB from "../db/sql/UserDB";
import exception from "../utils/Exception";
import blackListedJwtDB from "../db/redis/BlackListedJwtDB";
import forgotPasswordDB from "../db/sql/ForgotPasswordTokenDB";
import ForgotPasswordEmail from "../mail/ForgotPasswordEmail";
import mailSender from "../mail/MailSender";
import passwordHasher from "../utils/PasswordHasher";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";

const httpContext = require("express-http-context");

const log = loggerFactory.buildDebugLogger("src/service/UserService.js");

class UserService {
    deleteUser = async (req, res) => {
        httpContext.set("method", "deleteUser");
        const userId = req.user.id;
        const password = req.body.password;
        log.warn(`User with ID ${userId} wants to delete account`);
        try {
            await postgresDB.begin();
            const query = await userDB.getUserByIdUnsecured(userId);
            if (query.length !== 1) {
                return exception(res, 404, "User not found", null);
            }
            const user = query[0];
            if (await passwordHasher.validate(password, user.hashed_password) !== true) {
                log.debug("Old password does not match.");
                await postgresDB.rollback();
                return exception(res, 403, "The old password is not correct and therefore can not be verified", null);
            }
            await userDB.deleteUserById(userId);
            log.warn("User deleted account");
            return res.status(200).send("Account was deleted successfully");
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    userLogout = async (req, res) => {
        httpContext.set("method", "userLogout");
        log.debug("User want to log out");
        try {
            await blackListedJwtDB.add(req.headers.authorization);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    userInfo = async (req, res) => {
        httpContext.set("method", "userInfo");
        const userId = req.user.id;
        try {
            const result = await userDB.getUserById(userId);
            if (result.length === 1) {
                const user = result[0];
                return res.status(200).send({
                    "id": req.user.id,
                    "username": user.username,
                    "email": user.email,
                    "last_edited": user.last_edited,
                    "last_changed_password": user.last_changed_password,
                    "created": user.created
                });
            }
            return exception(res, 404, "User can not be found", userId);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    registerUser = async (req, res) => {
        httpContext.set("method", "registerUser");
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
                return exception(res, 409, "User name already taken.", null);
            }

            const usersByEmail = await userDB.getUserByEmailUnsecured(email);
            if (usersByEmail.length !== 0) {
                await postgresDB.rollback();
                return exception(res, 409, "Email already taken.", null);
            }

            const result = await userDB.register(username, hashed_password, email);
            if (result.length === 1) {
                await postgresDB.commit();
                return res.sendStatus(201);
            }
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", null);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    loginUser = async (req, res) => {
        httpContext.set("method", "loginUser");
        log.debug("User want to login");
        const {username, password} = req.body;
        try {
            const result = await userDB.getUserByUserNameUnsecured(username);
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
                        user_created_at: Date.parse(user.created) / 1000
                    });
                    return res.status(200).send({"jwt": token});
                }
                return exception(res, 403, "Authentication failed.");
            }
            return exception(res, 404, "User not found.");
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    changeUserInformation = async (req, res, next) => {
        httpContext.set("method", "changeUserInformation");
        log.debug("User want to change credentials and other information");

        const now = Date.now() / 1000;
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password ? req.body.new_password : null;
        const newEmail = req.body.email ? req.body.email : null;
        const newUsername = req.body.username ? req.body.username : null;
        const userId = req.user.id;

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
                    return exception(res, 409, "The email is taken", newEmail);
                }
                log.debug("Email is available");
            }
            if (newUsername) {
                const nameStillFree = results[0];
                results.shift();
                if (nameStillFree.length === 1) {
                    await postgresDB.rollback();
                    return exception(res, 409, "The username is taken", newUsername);
                }
                log.debug("Username is available");
            }

            const getUserQuery = await userDB.getUserByIdUnsecured(userId);
            log.debug(`Querying user with ID ${userId} returns ${getUserQuery}`);
            if (getUserQuery.length !== 1) {
                await postgresDB.rollback();
                return exception(res, 404, "Can not find user with the given ID", userId);
            }
            const user = getUserQuery[0];
            if (await passwordHasher.validate(oldPassword, user.hashed_password) !== true) {
                log.debug("Old password does not match.");
                await postgresDB.rollback();
                return exception(res, 403, "The old password is not correct and therefore can not be verified");
            }
            let newPasswordHash = null;
            if (newPassword) {
                newPasswordHash = await passwordHasher.encrypt(newPassword);
            }
            const changeUserInformationQuery = await userDB.changeUserInformation(userId, newUsername, newEmail, newPasswordHash, user.username, user.email, user.hashed_password);
            if (changeUserInformationQuery.length !== 1) {
                await postgresDB.rollback();
                return exception(res, 500, "An unexpected error happened. Please try again.");
            }
            await postgresDB.commit();

            // Since the user changed his information, the cache of the user object will most likely to be invalid
            // Therefore bust the cache and let the cache handler return the response.
            res.cache.response.status = 204;
            if (newPassword) {
                res.cache.write.last_changed_password = {
                    key: userId,
                    value: now
                };
            }
            return next();
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    sendResetEmail = async (req, res) => {
        if (!req.body) {
            return exception(res, 400, "Username or email is expected to reset password.");
        }
        const username = req.body.username ? req.body.username : null;
        const emailAddress = req.body.email ? req.body.email : null;
        try {
            await postgresDB.begin();
            if (emailAddress) {
                const query = await userDB.getUserByEmailUnsecured(emailAddress);
                if (query.length === 1) {
                    const user = query[0];
                    const forgotPasswordToken = await forgotPasswordDB.createForgotPasswordToken(user.id);
                    await postgresDB.commit();
                    const resetEmail = new ForgotPasswordEmail(emailAddress, {
                        username: user.username,
                        token: forgotPasswordToken[0].id
                    });
                    await mailSender.publish([resetEmail]);
                    log.info(`Sent following email for password resetting ${JSON.stringify(resetEmail)}`);
                    return res.status(200).send(`A reset email was sent to the address ${emailAddress}`);
                }
            }
            if (username) {
                const query = await userDB.getUserByUserNameUnsecured(username);
                if (query.length === 1) {
                    const user = query[0];
                    const forgotPasswordToken = await forgotPasswordDB.createForgotPasswordToken(user.id);
                    await postgresDB.commit();
                    const resetEmail = new ForgotPasswordEmail(emailAddress, {
                        username: user.username,
                        token: forgotPasswordToken[0].id
                    });
                    await mailSender.publish([resetEmail]);
                    log.info(`Sent following email for password resetting ${JSON.stringify(resetEmail)}`);
                    return res.status(200).send(`A reset email was sent to the address ${emailAddress}`);
                }
            }
            await postgresDB.rollback();
            return exception(res, 400, "Email or username is expected to send a password resetting email.");
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    resetForgottenPassword = async (req, res, next) => {
        const reset_password_token = req.body.reset_password_token;
        const new_password = req.body.new_password;
        const now = Date.now() / 1000;
        try {
            const hashed_password = await passwordHasher.encrypt(new_password);
            const query = await forgotPasswordDB.changeUserPassword(reset_password_token, hashed_password);

            // Since the user changed his information, the cache of the user object will most likely to be invalid
            // Therefore bust the cache and let the cache handler return the response.
            if (query.length === 1) {
                res.cache.response.status = 204;
                res.cache.write.last_changed_password = {
                    key: query[0].user_id,
                    value: now
                };
            }
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
        return next();
    }
}

const userServices = new UserService();
export default userServices;