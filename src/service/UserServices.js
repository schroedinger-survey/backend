const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const {register, getUser} = require("../dataaccess/UserDataAccess");

const registerUser = async (req, res) => {
    const {username, password, email} = req.body;
    const hashed_password = await bcrypt.hash(password, 10);
    try {
        const result = await register(username, hashed_password, email);
        if (result.rowCount === 1) {
            return res.sendStatus(201);
        }
        return res.sendStatus(500);
    } catch (e) {
        return res.sendStatus(409);
    }
}

const loginUser = async (req, res) => {
    const {username, password} = req.body;
    try {
        const result = await getUser(username);
        if (result.rowCount === 1) {
            const user =  result.rows[0];
            const hashed_password = user["hashed_password"];
            const id = user.id;
            const matchingPassword = await bcrypt.compare(password, hashed_password);

            if(matchingPassword){
                const token = jwt.sign( {id: id, username: username, exp: Math.floor(Date.now() / 1000) + Number(process.env.TTL)},process.env.SECRET);
                return res.status(200).send({"jwt": token});
            }
        } else {
            return res.sendStatus(404);
        }
    } catch (e) {
        return res.sendStatus(404);
    }
}

module.exports = {registerUser, loginUser};