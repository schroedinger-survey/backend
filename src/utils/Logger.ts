import Context from "./Context";

const {createLogger, format, transports} = require("winston");
const winston = require("winston");
const {combine, timestamp, prettyPrint, json, printf} = format;
const expressWinston = require("express-winston");
import ElasticsearchTransport from "winston-elasticsearch";
import {v4 as uuid} from "uuid";
import {opts} from "../drivers/ElasticsearchDB";

class LoggerFactory {

    /**
     * Most of the cases, you would want to use this logger to debug the application.
     * The result of this function return a Winston Logger. Read more about Winston at https://github.com/winstonjs/winston
     *
     * The result of each logging operation will be sent to an Elasticsearch server and therefore needs to be formatted
     * properly. The result will be saved in the Elasticsearch's index "debug"
     */
    buildDebugLogger = (name: string, useElasticsearch = true) => {
        const loggerTransports = [new transports.Console()];

        if (useElasticsearch === true) {
            loggerTransports.push(
                new ElasticsearchTransport({
                    level: process.env.SCHROEDINGER_DEBUG_LOG_LEVEL,
                    clientOpts: opts,
                    index: "debug",
                    transformer: (info) => {
                        const final = {
                            message: info.message,
                            level: info.level
                        };
                        if (Context.getId()) {
                            final["context"] = {type: "authenticated", id: Context.getId()};
                        } else {
                            final["context"] = {type: "system", id: uuid()};
                        }
                        if (Context.getTimestamp()) {
                            final["@timestamp"] = Context.getTimestamp();
                        } else {
                            final["@timestamp"] = new Date();
                        }
                        if (Context.getMethod()) {
                            final["method"] = Context.getMethod();
                        } else {
                            final["method"] = "Unknown method";
                        }
                        return final;
                    },
                    ensureMappingTemplate: false
                }));
        }

        const formats = [
            printf(info => {
                if (Context.getId()) {
                    info.context = {type: "authenticated", id: Context.getId()};
                } else {
                    info.context = {type: "system", id: uuid()};
                }
                if (Context.getMethod()) {
                    info.method = Context.getMethod();
                } else {
                    info.method = "Unknown method";
                }
                return JSON.stringify(info);
            }),
            timestamp(),
            prettyPrint()
        ];
        if (process.env.NODE_ENV === "production") {
            formats.push(json())
        }

        const format = combine(...formats);

        return createLogger({
            level: process.env.SCHROEDINGER_DEBUG_LOG_LEVEL,
            format: format,
            defaultMeta: {service: name},
            transports: loggerTransports
        });
    };

    /**
     * This is a special logger for monitoring server's access. It use the special module https://www.npmjs.com/package/express-winston
     * to log each REST call on the server. The result will be sent to the Elasticsearch's index "access" and therefore needs
     * to be formatted properly.
     */
    buildAccessLogger = () => {
        const loggerTransports = [
            new ElasticsearchTransport({
                level: process.env.SCHROEDINGER_ACCESS_LOG_LEVEL,
                clientOpts: opts,
                index: "access",
                transformer: (info) => {
                    const final = JSON.parse(info.message);
                    final.user_agent = info.meta.meta.req.headers["user-agent"];
                    if (Context.getId()) {
                        final.context = {type: "authenticated", id: Context.getId()};
                    } else {
                        final.context = {type: "system", id: uuid()};
                    }
                    if (info.meta.meta.httpRequest) {
                        final.host = info.meta.meta.httpRequest.remoteIp
                        final["@timestamp"] = info.meta.meta.httpRequest["@timestamp"];
                    }
                    return final;
                },
                ensureMappingTemplate: false
            })];
        if (process.env.NODE_ENV === "production") {
            loggerTransports.push(new transports.Console())
        }
        return expressWinston.logger({
            transports: loggerTransports,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.json(),
                winston.format.printf(info => {
                    const final = JSON.parse(info.message);
                    if (Context.getId()) {
                        final.context = {type: "authenticated", id: Context.getId()};
                    } else {
                        final.context = {type: "system", id: uuid()};
                    }
                    if (info.meta.httpRequest) {
                        final.host = info.meta.httpRequest.remoteIp
                        final["@timestamp"] = info.meta.httpRequest["@timestamp"];
                    }
                    final.user_agent = info.meta.req.headers["user-agent"];
                    return JSON.stringify(final);
                })
            ),
            meta: true,
            msg: `
            {
             "method": "{{req.method}}",
             "url": "{{req.url}}",
             "status": "{{res.statusCode}}",
             "response_time": {{res.responseTime}}
             }`,
            expressFormat: false,
            colorize: false
        });
    }
}

const loggerFactory = new LoggerFactory();
export default loggerFactory;