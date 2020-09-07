const { createLogger, format, transports } = require("winston");
const { combine, timestamp, prettyPrint, json, printf} = format;
require("winston-daily-rotate-file");
const httpContext = require("express-http-context");

const customFormat = printf(info => {
    if(httpContext.get("id")) {
        info.context = httpContext.get("id");
    }else{
        info.context = {"system": "System configuration"}
    }
    return JSON.stringify(info);
});

const Logger = (name) => {
    const root = [
        new transports.DailyRotateFile({
            filename: "logs/%DATE%-debug.log",
            datePattern: "YYYY-MM-DD-HH",
            zippedArchive: true,
            maxSize: "50mb",
            maxFiles: "30",
            options: {flags: "a"},
            auditFile: "logs/debug-audit.json"
        })
    ];
    if(process.env.NODE_ENV !== "production"){
        root.push(new transports.Console())
    }

    const format = process.env.NODE_ENV === "production" ?
        combine(
            timestamp(),
            prettyPrint(),
            json(),
            customFormat
        ):
        combine(
            timestamp(),
            prettyPrint(),
            customFormat
        )


    return createLogger({
        level: process.env.LOG_LEVEL,
        format:  format,
        defaultMeta: { service: name },
        transports: root
    });
};

module.exports = Logger;