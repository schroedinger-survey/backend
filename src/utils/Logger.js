const {createLogger, format, transports} = require("winston");
const winston = require("winston");
const {combine, timestamp, prettyPrint, json, printf} = format;
const httpContext = require("express-http-context");
const expressWinston = require("express-winston");
const Elasticsearch = require("winston-elasticsearch");

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

const debugClientOpts = {
    node: `http://${process.env.ELASTIC_HOST}:9200`
};
if (process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0) {
    debugClientOpts.auth = {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD
    }
}
const debugLoggerESTransport = new Elasticsearch.ElasticsearchTransport({
    level: process.env.DEBUG_LOG_LEVEL,
    clientOpts: debugClientOpts,
    index: "debug",
    transformer: debugElasticSearchFormat
});
debugLoggerESTransport.on("error", (error) => {
    console.error("Error caught", JSON.stringify(error, null, "\t"));
});

const DebugLogger = (name) => {
    const loggerTransports = [
        debugLoggerESTransport
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

    const ret = createLogger({
        level: process.env.DEBUG_LOG_LEVEL,
        format: format,
        defaultMeta: {service: name},
        transports: loggerTransports
    });

    ret.on("error", (error) => {
        console.error("Error caught", JSON.stringify(error, null, "\t"));
    });

    return ret;
};

const accessClientOpts = {
    node: `http://${process.env.ELASTIC_HOST}:9200`
};
if (process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0) {
    accessClientOpts.auth = {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD
    }
}
const accessLoggerESTransport = new Elasticsearch.ElasticsearchTransport({
    level: process.env.ACCESS_LOG_LEVEL,
    clientOpts: accessClientOpts,
    index: "access",
    transformer: accessElasticSearchFormat
});

accessLoggerESTransport.on("error", (error) => {
    console.error("Error caught", JSON.stringify(error, null, "\t"));
});

const AccessLogger = () => {
    const loggerTransports = [
        accessLoggerESTransport
    ];
    if (process.env.NODE_ENV === "production") {
        loggerTransports.push(new transports.Console())
    }
    const ret = expressWinston.logger({
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

    return ret;
}

module.exports = {DebugLogger, AccessLogger};