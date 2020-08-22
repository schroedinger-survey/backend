const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userDB = require("../db/UserDB");
const queryConvert = require("../utils/QueryConverter");
const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;

class UserService {
    constructor() {
        this.userInfo = this.userInfo.bind(this);
        this.registerUser = this.registerUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.userLogout = this.userLogout.bind(this);
    }

    async userLogout(req, res) {
        try {
            console.log("User tryna logout");
            await redisDB.sadd("BLOCK_LIST", req.headers.authorization);
            return res.sendStatus(204);
        } catch (e) {
            return res.status(500).send(e.message);
        }
    }

    async userInfo(req, res) {
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
            return res.status(500).send(e.message);
        }
    }

    async registerUser(req, res) {
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        const hashed_password = await bcrypt.hash(password, 100);
        try {
            const result = await userDB.register(username, hashed_password, email);
            if (result.rowCount === 1) {
                return res.sendStatus(201);
            }
            return res.sendStatus(500);
        } catch (e) {
            return res.sendStatus(409);
        }
    }

    async loginUser(req, res) {
        const {username, password} = req.body;
        try {
            const result = queryConvert(await userDB.getUser(username));
            if (result.length === 1) {
                const user = result[0];
                const hashed_password = user.hashed_password;
                const id = user.id;
                const matchingPassword = await bcrypt.compare(password, hashed_password);

                if (matchingPassword) {
                    const token = jwt.sign({
                        id: id,
                        username: username,
                        exp: Math.floor(Date.now() / 1000) + TTL
                    }, SECRET);
                    return res.status(200).send({"jwt": token});
                }
                return res.sendStatus(403);
            }
            return res.status(404).send("User not found.");
        } catch (e) {
            return res.status(500).send(e.message);
        }
    }
}

const userServices = new UserService();

module.exports = userServices;