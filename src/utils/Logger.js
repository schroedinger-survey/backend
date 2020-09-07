const {createLogger, format, transports} = require("winston");
const winston = require("winston");
const {combine, timestamp, prettyPrint, json, printf} = format;
const httpContext = require("express-http-context");
const expressWinston = require("express-winston");
const Elasticsearch = require("winston-elasticsearch");
require("winston-daily-rotate-file");

const debugElasticSearchFormat = (info) => {
    const final = {};
    final.message = info.message;
    final.level = info.level;
    if (httpContext.get("id")) {
        final.context = httpContext.get("id");
    } else {
        final.context = {"system": "System configuration"}
    }
    if (httpContext.get("@timestamp")) {
        final["@timestamp"] = httpContext.get("@timestamp");
    } else {
        final["@timestamp"] = new Date();
    }
    return final;
};

const accessElasticSearchFormat = (info) => {
    const final = JSON.parse(info.message);
    final.user_agent = info.meta.meta.req.headers["user-agent"];
    if (httpContext.get("id")) {
        final.context = httpContext.get("id");
    } else {
        final.context = {"system": "System configuration"}
    }
    if (info.meta.meta.httpRequest) {
        final.host = info.meta.meta.httpRequest.remoteIp
        final["@timestamp"] = info.meta.meta.httpRequest["@timestamp"];
    }
    return final;
};


const debugFormat = printf(info => {
    if (httpContext.get("id")) {
        info.context = httpContext.get("id");
    } else {
        info.context = {"system": "System configuration"}
    }
    return JSON.stringify(info);
});


const accessFormat = winston.format.printf(info => {
    const final = JSON.parse(info.message);
    if (httpContext.get("id")) {
        final.context = httpContext.get("id");
    } else {
        final.context = {"system": "System configuration"}
    }
    if (info.meta.httpRequest) {
        final.host = info.meta.httpRequest.remoteIp
        final["@timestamp"] = info.meta.httpRequest["@timestamp"];
    }
    final.user_agent = info.meta.req.headers["user-agent"];
    return JSON.stringify(final);
});


const DebugLogger = (name) => {
    const clientOpts = {
        node: `http://${process.env.ELASTIC_HOST}:9200`
    };
    if(process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0){
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
            transformer: debugElasticSearchFormat
        })
    ];
    loggerTransports.push(new transports.Console())

    const format = process.env.NODE_ENV === "production" ?
        combine(
            timestamp(),
            prettyPrint(),
            json(),
            debugFormat
        ) :
        combine(
            timestamp(),
            prettyPrint(),
            debugFormat
        )


    return createLogger({
        level: process.env.DEBUG_LOG_LEVEL,
        format: format,
        defaultMeta: {service: name},
        transports: loggerTransports
    });
};

const AccessLogger = () => {
    const clientOpts = {
        node: `http://${process.env.ELASTIC_HOST}:9200`
    };
    if(process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0){
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
            transformer: accessElasticSearchFormat
        })];
    if (process.env.NODE_ENV === "production") {
        loggerTransports.push(new transports.Console())
    }
    return expressWinston.logger({
        transports: loggerTransports,
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.json(),
            accessFormat
        ),
        meta: true, dynamicMeta: (req, res) => {
            const httpRequest = {}
            const meta = {}
            if (req) {
                meta.httpRequest = httpRequest
                httpRequest.requestMethod = req.method;
                httpRequest.requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
                httpRequest.protocol = `HTTP/${req.httpVersion}`;
                httpRequest.remoteIp = req.ip.indexOf(":") >= 0 ? req.ip.substring(req.ip.lastIndexOf(":") + 1) : req.ip;
                httpRequest.requestSize = req.socket.bytesRead;
                httpRequest.userAgent = req.get("User-Agent");
                httpRequest.referrer = req.get("Referrer");
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

module.exports = {DebugLogger, AccessLogger};