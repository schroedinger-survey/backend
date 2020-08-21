const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
const app = express();

const userRouter = require("./src/router/UserRouters");
const healthRouter = require("./src/router/HealthRouters");
const redisAccess = require("./src/dataaccess/RedisAccess");
const sqlAccess = require("./src/dataaccess/SQLAccess");
const securityRouter = require("./src/router/SecurityRouters");

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    await redisAccess.close();
    await sqlAccess.close()
}

module.exports = app;