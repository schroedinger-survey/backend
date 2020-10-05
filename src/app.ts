import Context from "./utils/Context";
import tokenRouter from "./router/TokenRouter";
import userRouter from "./router/UserRouter";
import healthRouter from "./utils/HealthRouter";
import securityRouter from "./security/SecurityRouter";
import surveyRouter from "./router/SurveyRouter";
import submissionRouter from "./router/SubmissionRouter";
import postgresDB from "./data/drivers/PostgresDB";
import elasticsearchDB from "./data/drivers/ElasticsearchDB";
import loggerFactory from "./utils/Logger";
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
const helmet = require("helmet");
import rabbitmq from "./data/drivers/RabbitMQ";
import initialize from "./initialize";
const log = loggerFactory.buildDebugLogger("src/app.ts");


app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(Context.middleware());
app.use(initialize);
app.use(loggerFactory.buildAccessLogger());
app.use(helmet());
app.use("/token", tokenRouter);
app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/survey", surveyRouter);
app.use("/submission", submissionRouter);

// SWAGGER UI
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    log.debug("Closing server");
    await postgresDB.close();
    await elasticsearchDB.close();
    await rabbitmq.close();
}

export default app;