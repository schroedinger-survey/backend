const express = require("express");

const userRouter = express.Router();

userRouter.post("/");
userRouter.post("/login");

module.exports = userRouter;