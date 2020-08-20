const bcrypt = require("bcrypt");

const {register} = require("../dataaccess/UserDataAccess");

const registerUser = async (req, res) => {
    const {username, password, email} = req.body;
    const hashed_password = await bcrypt.hash(password, 10);
    try {
        const result = await register(username, hashed_password, email);
        if (result.rowCount === 1) {
            return res.sendStatus(201);
        }else {
            return res.sendStatus(500);
        }
    } catch (e) {
        return res.sendStatus(409);
    }
}

module.exports = {registerUser};