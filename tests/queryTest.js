require("dotenv-flow").config();
const sqlAccess = require("../src/dataaccess/SQLAccess");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerNewUser = async(username, password, email) => {
    const hashed_password = await bcrypt.hash(password, 10);
    const createUser = {
        name: "create-user",
        text: "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3)",
        values: [username, hashed_password, email]
    }
    try{
        const result = await sqlAccess.query(createUser);
        console.log(result);
    } catch (e) {
        console.log(e.detail);
    } finally {
        sqlAccess.close();
    }
}
//registerNewUser("mom", "yourmom", "mom@gmail.de");

const main2 = async(username, password) => {
    const selectUser = {
        name: "select-user",
        text: "SELECT * FROM users WHERE username= $1",
        values: [username]
    };
    try{
        const result = await sqlAccess.query(selectUser);
        if (result.rows.length === 1){
            const user = result.rows[0];
            const hashed_password = user["hashed_password"];
            const id = user.id;
            const match = await bcrypt.compare(password, hashed_password);

            if(match){
                const token = jwt.sign( {id: id, username: username, exp: Math.floor(Date.now() / 1000) - (60 * 60)},"supersecretsecret");
                console.log(token);
                authorizeUser(token);
            }
        } else {
            console.log("User not found");
        }
    }catch (e) {
        console.log(e);
    } finally {
        sqlAccess.close();
    }
}
main2("mom", "yourmom");

const authorizeUser = (jwtToken) => {
    try{
        const decoded = jwt.verify(jwtToken, "supersecretsecret");
        console.log(decoded);
    } catch (e) {
        console.log(e.message);
    }

}