const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;
const blackListedJwtDB = require("../db/BlackListedJwtDB");
const queryConvert = require("../utils/QueryConverter");
const tokenDB = require("../db/TokenDB");

const securedPath = async (req, res, next) => {
    try {
        let jwtToken = null;
        if(req.headers && req.headers.authorization) {
            jwtToken = req.headers.authorization
        }
        if (jwtToken) {
            if(!(await blackListedJwtDB.isBlackListed(jwtToken))) {
                req.user = jwt.verify(jwtToken, SECRET);
                return next();
            }else{
                return res.status(403).send("JWT token missing or expired.");
            }
        } else {
            return res.status(403).send("JWT token missing or expired.");
        }
    } catch (e) {
        return res.status(403).send(e.message);
    }
};

const securedOrOneTimePassPath = async (req, res, next) => {
    try {
        let jwtToken = null;
        if(req.headers && req.headers.authorization) {
            jwtToken = req.headers.authorization
        }

        let oneTimePass = null;
        if(req.query && req.query.token) {
            oneTimePass = req.query.token
        }

        if (jwtToken) {
            if(!(await blackListedJwtDB.isBlackListed(jwtToken))) {
                req.user = jwt.verify(jwtToken, SECRET);
            }
        }

        if(oneTimePass){
            const tokens = queryConvert(await tokenDB.getToken(oneTimePass));
            if(tokens.length === 0){
                return res.status(403).send("Token not found!");
            }else{
                req.token = tokens[0];
            }
        }
        if(jwtToken || oneTimePass){
            return next();
        }
        return res.status(403).send("No JWT token or Participation.");
    } catch (e) {
        return res.status(403).send(e.message);
    }
};



module.exports = {securedPath, securedOrOneTimePassPath};