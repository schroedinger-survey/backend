import {uuid} from "uuidv4";
const jwt = require("jsonwebtoken");

const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;

class JsonWebToken{
    sign(payload) {
        const iat = Math.floor(Date.now() / 1000);
        payload["iat"] = iat;
        payload["exp"] = iat + TTL;
        payload["salt"] = uuid();
        return jwt.sign(payload, SECRET);
    }

    verify(token){
        return jwt.verify(token, SECRET)
    }
}

const jsonWebToken = new JsonWebToken();
export default jsonWebToken;