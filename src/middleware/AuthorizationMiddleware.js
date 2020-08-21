const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

const securedPath = (req, res, next) => {
    try {
        const token = req.headers ? req.headers.authorization : null;
        if (token) {
            req.user = jwt.verify(token, SECRET);
            next();
        } else {
            res.status(403).send("JWT token missing");
        }
    } catch (e) {
        res.status(403).send(e.message);
    }
}

module.exports = securedPath;