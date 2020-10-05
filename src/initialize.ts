import {NextFunction, Request, Response} from "express";
import Context from "./utils/Context";
import {v4 as uuid} from "uuid";
import ErrorMessage from "./errors/ErrorMessage";
import loggerFactory from "./utils/Logger";
const atob = require("atob");

const log = loggerFactory.buildDebugLogger("src/initialize.ts");
/**
 * Assigning each REST call on the server with an ID. If the request has a JWT token,
 * the ID in the JWT's payload will be used as ID. Else an UUID will be used.
 */
const initialize = (req: Request, res: Response, next: NextFunction) => {
    Context.bindRequest(req);
    Context.bindResponse(res);
    Context.setMethod("assignContext");
    req["schroedinger"] = {};
    res["schroedinger"] = {};

    if (req.headers && req.headers.authorization) {
        try {
            const body = JSON.parse(atob(req.headers.authorization.split(".")[1]));
            req["schroedinger"].id = JSON.stringify({type: "authenticated", id: body.username});
        } catch (e) {
            log.debug("Error while assigning ID to request.", e.message)
            req["schroedinger"].id = JSON.stringify({type: "anonymous", id: uuid()});
        }
    } else {
        req["schroedinger"].id = JSON.stringify({type: "anonymous", id: uuid()});
    }
    const now = new Date();
    req["schroedinger"]["@timestamp"] = now;

    Context.setId(JSON.parse(req["schroedinger"].id).id);
    Context.setTimestamp(String(now.getTime()));

    res["schroedinger"].error = function(error: ErrorMessage){
        return res.status(error.statusCode()).send(JSON.stringify(error.serialize()));
    }
    return next();
}

export default initialize;