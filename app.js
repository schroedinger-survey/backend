const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
const app = express();

const userRouter = require("./src/router/UserRouter");
const healthRouter = require("./src/router/HealthRouter");
const redisAccess = require("./src/db/RedisDB");
const sqlAccess = require("./src/db/PostgresDB");
const securityRouter = require("./src/router/SecurityRouter");
const surveyRouter = require("./src/router/SurveyRouter");
const tokenRouter = require("./src/router/TokenRouter");
const submissionRouter = require("./src/router/SubmissionRouter");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const shouldCompress = require("./src/middleware/CompressionMiddleware");
const morgan = require("morgan");
const fs = require('fs');
const path = require('path')
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'})
const {v4: uuidv4} = require("uuid");
const atob = require('atob');

app.use(express.json());
app.use(express.urlencoded({extended: false}));

morgan.token('id', function getId(req) {
    return req.id
});

function assignContext(req, res, next) {
    if (req.headers && req.headers.authorization) {
        try {
            const body = atob(req.headers.authorization.split(".")[1])
            req.id = body;
        }catch (e){
            req.id = JSON.stringify({anonymous: uuidv4()});
        }
    } else {
        req.id = JSON.stringify({anonymous: uuidv4()});
    }
    return next();
}

app.use(assignContext);
app.use(morgan(':id - [:date[clf]] ":method :url :status - :response-time ms', {stream: accessLogStream}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use(limiter);
app.use(helmet());
app.use(compression({filter: shouldCompress}));

app.use("/token", tokenRouter);
app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/survey", surveyRouter);
app.use("/submission", submissionRouter);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    await redisAccess.close();
    await sqlAccess.close()
}

module.exports = app;