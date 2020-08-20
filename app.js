const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
const app = express();

const userRouter = require("./src/router/UserRouters");

app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use("/api/user", userRouter);
app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;