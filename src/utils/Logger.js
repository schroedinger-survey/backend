const { createLogger, format, transports } = require("winston");
const { combine, timestamp, prettyPrint, json, printf} = format;
const httpContext = require("express-http-context");



const customFormat = printf(info => {
    info.context = httpContext.get("id");
    return JSON.stringify(info);
});

const Logger = (name) => {
    const root = [
        new transports.File({ filename: "logs/debug.log" })
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