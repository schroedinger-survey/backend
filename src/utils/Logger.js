const { createLogger, format, transports } = require('winston');
const { combine, timestamp, prettyPrint, json } = format;


const Logger = (name) => {
    let root = [
        new transports.File({ filename: 'logs/debug.log' }),
    ];
    if(process.env.NODE_ENV !== 'production'){
        root.push(new transports.Console())
    }

    let format = process.env.NODE_ENV === 'production' ?
        combine(
            timestamp(),
            prettyPrint(),
            json()
        ):
        combine(
            timestamp(),
            prettyPrint()
        )


    return createLogger({
        level: process.env.LOG_LEVEL,
        format:  format,
        defaultMeta: { service: name },
        transports: root,
    });
};

module.exports = Logger;