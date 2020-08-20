"use strict";

const axios = require("axios");

const RECAPTCHA_TOKEN = process.env.RECAPTCHA_TOKEN;

const recaptchaPath = async (req, res, next) => {
    const token = req.query.recaptcha;
    if (token) {
        try {
            const data = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_TOKEN}&response=${token}`);
            if (data.success === true) {
                next();
            } else {
                res.status(400).send("ReCaptcha Verification not a success");
            }
        } catch (e) {
            res.status(500).send(JSON.stringify(e));
        }
    } else {
        res.status(403).send("Recaptcha token missing");
    }
}

module.exports = recaptchaPath;