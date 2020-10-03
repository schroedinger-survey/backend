import {Request, Response} from "express";

const httpContext = require("express-http-context");

export default class Context{
    static setMethod(methodName: string) :void {
        httpContext.set("method", methodName);
    }

    static getMethod() : string{
        return httpContext.get("method");
    }

    static setId(id: string) : void{
        httpContext.set("id", id);
    }

    static getId() : string{
        return httpContext.get("id");
    }

    static setTimestamp(timestamp: string) : void{
        httpContext.set("@timestamp", timestamp);
    }

    static getTimestamp() : string{
        return httpContext.get("@timestamp");
    }

    static bindRequest(req: Request) : void{
        httpContext.ns.bindEmitter(req);
    }

    static bindResponse(res: Response) : void{
        httpContext.ns.bindEmitter(res);
    }

    static middleware() : void{
        return httpContext.middleware;
    }
}