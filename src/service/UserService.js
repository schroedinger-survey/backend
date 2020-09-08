const httpContext = require("express-http-context");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userDB = require("../db/UserDB");
const queryConvert = require("../utils/QueryConverter");
const blackListedJwtDB = require("../db/BlackListedJwtDB");
const postgresDB = require("../db/PostgresDB");
const Exception = require("../exception/Exception");
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
            if(usersByUsername.length !== 0){
                await postgresDB.rollback();
                return Exception(409, "User name already taken.").send(res);
            }

            const usersByEmail = queryConvert(await userDB.getUserByEmail(email));
            if(usersByEmail.length !== 0){
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
}

const userServices = new UserService();
module.exports = userServices;