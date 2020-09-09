const httpContext = require("express-http-context");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userDB = require("../db/UserDB");
const queryConvert = require("../utils/QueryConverter");
const blackListedJwtDB = require("../db/BlackListedJwtDB");
const postgresDB = require("../drivers/PostgresDB");
const Exception = require("../utils/Exception");
const redisDB = require("../drivers/RedisDB");
const {getRedisKeyLastPasswordChangeDate} = require("../middleware/AuthorizationMiddleware");
const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;
const {v4: uuidv4} = require("uuid");
const {DebugLogger} = require("../utils/Logger");

const log = DebugLogger("src/service/UserService.js");

class UserService {
    constructor() {
        this.userInfo = this.userInfo.bind(this);
        this.registerUser = this.registerUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.userLogout = this.userLogout.bind(this);
    }

    async userLogout(req, res) {
        httpContext.set("method", "userLogout");
        log.debug("User want to log out");
        try {
            await blackListedJwtDB.add(req.headers.authorization);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return res.status(500).send(e.message);
        }
    }

    async userInfo(req, res) {
        httpContext.set("method", "userInfo");
        const userId = req.user.id;
        try {
            const result = queryConvert(await userDB.getUserById(userId));
            if (result.length === 1) {
                const user = result[0];
                return res.status(200).send({
                    "id": req.user.id,
                    "username": user.username,
                    "email": user.email,
                    "created": user.created
                });
            }
            return res.status(404).send("User not found.");
        } catch (e) {
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async registerUser(req, res) {
        httpContext.set("method", "registerUser");
        log.debug("New user want to register");
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        const hashed_password = await bcrypt.hash(password, 1);
        try {
            await postgresDB.begin();

            const usersByUsername = queryConvert(await userDB.getUser(username));
            if (usersByUsername.length !== 0) {
                await postgresDB.rollback();
                return Exception(409, "User name already taken.").send(res);
            }

            const usersByEmail = queryConvert(await userDB.getUserByEmail(email));
            if (usersByEmail.length !== 0) {
                await postgresDB.rollback();
                return Exception(409, "Email already taken.").send(res);
            }

            const result = await userDB.register(username, hashed_password, email);
            if (result.rowCount === 1) {
                await postgresDB.commit();
                return res.sendStatus(201);
            }
            await postgresDB.rollback();
            return res.sendStatus(500);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async loginUser(req, res) {
        httpContext.set("method", "loginUser");
        log.debug("User want to login");
        const {username, password} = req.body;
        try {
            const result = queryConvert(await userDB.getUser(username));
            if (result.length === 1) {
                const user = result[0];
                const hashed_password = user.hashed_password;
                const id = user.id;
                const matchingPassword = await bcrypt.compare(password, hashed_password);

                if (matchingPassword) {
                    const iat = Math.floor(Date.now() / 1000);
                    const token = jwt.sign({
                        id: id,
                        username: username,
                        iat: iat,
                        exp: iat + TTL,
                        user_created_at: Date.parse(user.created) / 1000,
                        salt: uuidv4()
                    }, SECRET);
                    return res.status(200).send({"jwt": token});
                }
                return Exception(403, "Authentication failed.").send(res);
            }
            return Exception(404, "User not found.").send(res);
        } catch (e) {
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async changeUserInformation(req, res) {
        httpContext.set("method", "changeUserInformation");
        log.debug("User want to change credentials and other information");
        const oldPassword = req.body.old_password;
        const newPassword = req.body.new_password ? req.body.new_password : null;
        const newEmail = req.body.email ? req.body.email : null;
        const newUsername = req.body.username ? req.body.username : null;
        const userId = req.user.id;
        try {
            await postgresDB.begin();
            log.debug("Check if username and email are available");
            const checkIfEmailAndUsernamesAreFree = [];
            if (newEmail) {
                checkIfEmailAndUsernamesAreFree.push(userDB.getUserByEmail(newEmail));
            }
            if (newUsername) {
                checkIfEmailAndUsernamesAreFree.push(userDB.getUser(newUsername));
            }
            const results = await Promise.all(checkIfEmailAndUsernamesAreFree);
            log.debug(`Result of email and username check return ${results.length} rows`);
            if (newEmail) {
                const emailStillFree = queryConvert(results[0]);
                results.shift();
                if (emailStillFree.length === 1) {
                    await postgresDB.rollback();
                    return Exception(409, "The email is taken", newEmail);
                }
                log.debug("Email is available");
            }
            if (newUsername) {
                const nameStillFree = queryConvert(results[0]);
                results.shift();
                if (nameStillFree.length === 1) {
                    await postgresDB.rollback();
                    return Exception(409, "The username is taken", newUsername);
                }
                log.debug("Username is available");
            }

            const getUserQuery = queryConvert(await userDB.getUserByIdUnsecured(userId));
            log.debug(`Querying user with ID ${userId} returns ${getUserQuery}`);
            if (getUserQuery.length !== 1) {
                await postgresDB.rollback();
                return Exception(404, "Can not find user with the given ID", userId).send(res);
            }
            const user = getUserQuery[0];
            if (await bcrypt.compare(oldPassword, user.hashed_password) !== true) {
                log.debug("Old password does not match.");
                await postgresDB.rollback();
                return Exception(403, "The old password is not correct and therefore can not be verified").send(res);
            }
            let newPasswordHash = null;
            if (newPassword) {
                newPasswordHash = await bcrypt.hash(newPassword, 1);
            }
            const changeUserInformationQuery = await userDB.changeUserInformation(userId, newUsername, newEmail, newPasswordHash, user.username, user.email, user.hashed_password);
            if (queryConvert(changeUserInformationQuery).length === 1) {
                await postgresDB.commit();
                if(newPassword){
                    await redisDB.set(getRedisKeyLastPasswordChangeDate(userId), Date.now() / 1000)
                }
                return res.sendStatus(204);
            }
            await postgresDB.rollback();
            return Exception(500, "An unexpected error happened. Please try again.");
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }
}

const userServices = new UserService();
module.exports = userServices;