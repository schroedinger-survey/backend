const {createLogger, format, transports} = require("winston");
const winston = require("winston");
const {combine, timestamp, prettyPrint, json, printf} = format;
const httpContext = require("express-http-context");
const expressWinston = require("express-winston");
const Elasticsearch = require("winston-elasticsearch");
import {uuid} from 'uuidv4';

class LoggerFactory {
    /**
     * Most of the cases, you would want to use this logger to debug the application.
     * The result of this function return a Winston Logger. Read more about Winston at https://github.com/winstonjs/winston
     *
     * The result of each logging operation will be sent to an Elasticsearch server and therefore needs to be formatted
     * properly. The result will be saved in the Elasticsearch's index "debug"
     *
     * @param name
     * @returns {winston.Logger}
     * @constructor
     */
    buildDebugLogger = (name) => {
        const clientOpts = {
            node: `http://${process.env.ELASTIC_HOST}:9200`,
            auth: {}
        };
        if (process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0) {
            clientOpts.auth = {
                username: process.env.ELASTIC_USERNAME,
                password: process.env.ELASTIC_PASSWORD
            }
        }
        const loggerTransports = [
            new Elasticsearch.ElasticsearchTransport({
                level: process.env.DEBUG_LOG_LEVEL,
                clientOpts: clientOpts,
                index: "debug",
                transformer: (info) => {
                    const final = {
                        message: info.message,
                        level: info.level
                    };
                    if (httpContext.get("id")) {
                        final["context"] = {type: "authenticated", id: httpContext.get("id")};
                    } else {
                        final["context"] = {type: "system", id: uuid()};
                    }
                    if (httpContext.get("@timestamp")) {
                        final["@timestamp"] = httpContext.get("@timestamp");
                    } else {
                        final["@timestamp"] = new Date();
                    }
                    if (httpContext.get("method")) {
                        final["method"] = httpContext.get("method");
                    } else {
                        final["method"] = "Unknown method";
                    }
                    return final;
                },
                ensureMappingTemplate: false
            }),
            new transports.Console()
        ];

        const formats = [
            printf(info => {
                if (httpContext.get("id")) {
                    info.context = {type: "authenticated", id: httpContext.get("id")};
                } else {
                    info.context = {type: "system", id: uuid()};
                }
                if (httpContext.get("method")) {
                    info.method = httpContext.get("method");
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
            level: process.env.DEBUG_LOG_LEVEL,
            format: format,
            defaultMeta: {service: name},
            transports: loggerTransports
        });
    };

    /**
     * This is a special logger for monitoring server's access. It use the special module https://www.npmjs.com/package/express-winston
     * to log each REST call on the server. The result will be sent to the Elasticsearch's index "access" and therefore needs
     * to be formatted properly.
     *
     * @returns {Handler}
     */
    buildAccessLogger = () => {
        const clientOpts = {
            node: `http://${process.env.ELASTIC_HOST}:9200`,
            auth: {}
        };
        if (process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0) {
            clientOpts.auth = {
                username: process.env.ELASTIC_USERNAME,
                password: process.env.ELASTIC_PASSWORD
            }
        }
        const loggerTransports = [
            new Elasticsearch.ElasticsearchTransport({
                level: process.env.ACCESS_LOG_LEVEL,
                clientOpts: clientOpts,
                index: "access",
                transformer: (info) => {
                    const final = JSON.parse(info.message);
                    final.user_agent = info.meta.meta.req.headers["user-agent"];
                    if (httpContext.get("id")) {
                        final.context = {type: "authenticated", id: httpContext.get("id")};
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
                    if (httpContext.get("id")) {
                        final.context = {type: "authenticated", id: httpContext.get("id")};
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
            meta: true, dynamicMeta: (req, res) => {
                const httpRequest = {}
                const meta = {}
                if (req) {
                    meta["httpRequest"] = httpRequest
                    httpRequest["requestMethod"] = req.method;
                    httpRequest["requestUrl"] = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
                    httpRequest["protocol"] = `HTTP/${req.httpVersion}`;
                    httpRequest["remoteIp"] = req.ip.indexOf(":") >= 0 ? req.ip.substring(req.ip.lastIndexOf(":") + 1) : req.ip;
                    httpRequest["requestSize"] = req.socket.bytesRead;
                    httpRequest["userAgent"] = req.get("User-Agent");
                    httpRequest["referrer"] = req.get("Referrer");
                    httpRequest["@timestamp"] = req["@timestamp"];
                }
                return meta
            },
            msg: `
    {
     "method": "{{req.method}}",
     "url": "{{req.url}}",
     "status": "{{res.statusCode}}",
     "response_time": {{res.responseTime}}
     }`,
            expressFormat: false,
            colorize: false,
            ignoreRoute: function (req, res) {
                return false;
            }
        });
    }
}
const loggerFactory = new LoggerFactory();
export default loggerFactory;