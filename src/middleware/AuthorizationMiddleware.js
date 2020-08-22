const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;
const blackListedJwtDB = require("../db/BlackListedJwtDB");

const securedPath = async (req, res, next) => {
    try {
        const token = req.headers ? req.headers.authorization : null;
        if (token) {
            if(!(await blackListedJwtDB.isBlackListed(token))) {
                req.user = jwt.verify(token, SECRET);
                next();
            }else{
                res.status(403).send("JWT token missing or expired.");
            }
        } else {
            res.status(403).send("JWT token missing or expired.");
        }
    } catch (e) {
        res.status(403).send(e.message);
    }
}

module.exports = securedPath;