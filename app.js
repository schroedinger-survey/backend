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

app.use(express.json());
app.use(express.urlencoded({extended: false}));

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