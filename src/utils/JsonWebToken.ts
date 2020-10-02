import {uuid} from "uuidv4";
import SchroedingerTimeStamp from "./SchroedingerTimeStamp";
const jwt = require("jsonwebtoken");

const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;

class JsonWebToken{
    sign(payload: object) {
        payload["salt"] = uuid();
        payload["issued_at_utc"] = SchroedingerTimeStamp.currentUTCMsTimeStamp();
        return jwt.sign(payload, SECRET, {algorithm: "HS512", expiresIn: TTL});
    }

    verify(token: string){
        jwt.verify(token, SECRET);
        return this.unsecuredGetPayload(token);
    }

    unsecuredGetPayload(token: string){
        return jwt.decode(token);
    }
}

const jsonWebToken = new JsonWebToken();
export default jsonWebToken;