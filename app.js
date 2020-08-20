const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const app = express();

const userRouter = require("./src/router/UserRouters");

app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/user", userRouter);

module.exports = app;