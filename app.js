const express = require("express");
const app = express();

const userRouter = require("./src/router/UserRouters");

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/api/user", userRouter);

module.exports = app;