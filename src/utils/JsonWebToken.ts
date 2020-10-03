import { v4 as uuid } from "uuid";
import SchroedingerTimeStamp from "./SchroedingerTimeStamp";
const jwt = require("jsonwebtoken");

const SCHROEDINGER_JWT_TTL = Number(process.env.SCHROEDINGER_JWT_TTL);
const SCHROEDINGER_JWT_SECRET = process.env.SCHROEDINGER_JWT_SECRET;

class JsonWebToken{
    sign(payload: Record<string, unknown>) {
        payload["salt"] = uuid();
        payload["issued_at_utc"] = SchroedingerTimeStamp.currentUTCMsTimeStamp();
        return jwt.sign(payload, SCHROEDINGER_JWT_SECRET, {algorithm: "HS512", expiresIn: SCHROEDINGER_JWT_TTL});
    }

    verify(token: string){
        jwt.verify(token, SCHROEDINGER_JWT_SECRET);
        return this.unsecuredGetPayload(token);
    }

    unsecuredGetPayload(token: string){
        return jwt.decode(token);
    }
}

const jsonWebToken = new JsonWebToken();
export default jsonWebToken;