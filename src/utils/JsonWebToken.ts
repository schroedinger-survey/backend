import {uuid} from "uuidv4";
const jwt = require("jsonwebtoken");

const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;

class JsonWebToken{
    sign(payload) {
        payload["salt"] = uuid();
        payload["iat"] = Date.now() / 1000 + 1;
        payload["exp"] = payload["iat"] + TTL
        return jwt.sign(payload, SECRET, {algorithm: "HS512"});
    }

    verify(token){
        return jwt.verify(token, SECRET);
    }

    unsecuredPayload(token){
        return jwt.decode(token);
    }
}

const jsonWebToken = new JsonWebToken();
export default jsonWebToken;