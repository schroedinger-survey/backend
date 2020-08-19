const express = require("express");

const submissionRouter = express.Router();

submissionRouter.post("/");
submissionRouter.get("/:survey_id")