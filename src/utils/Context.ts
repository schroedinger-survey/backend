import {Request, Response} from "express";

const httpContext = require("express-http-context");

export default class Context{
    static setMethod(methodName: string) {
        httpContext.set("method", methodName);
    }

    static getMethod() : string{
        return httpContext.get("method");
    }

    static setId(id: string){
        httpContext.set("id", id);
    }

    static getId() : string{
        return httpContext.get("id");
    }

    static setTimestamp(timestamp: string) {
        httpContext.set("@timestamp", timestamp);
    }

    static getTimestamp() : string{
        return httpContext.get("@timestamp");
    }

    static bindRequest(req: Request){
        httpContext.ns.bindEmitter(req);
    }

    static bindResponse(res: Response){
        httpContext.ns.bindEmitter(res);
    }

    static middleware(){
        return httpContext.middleware;
    }
}