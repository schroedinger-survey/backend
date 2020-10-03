import { v4 as uuid } from "uuid";
import SchroedingerTimeStamp from "./SchroedingerTimeStamp";
const jwt = require("jsonwebtoken");

const TTL = Number(process.env.TTL);
const SECRET = process.env.SECRET;

class JsonWebToken{
    sign(payload: Record<string, unknown>) {
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