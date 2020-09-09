const app = require("../src/app");
const supertest = require("supertest");
const request = supertest(app);

const utilRegister = (username, email, password) => {
    return request.post("/user").send({
        "username": username,
        "password": password,
        "email": email
    });
};

const utilLogin = (username, password) => {
    return request.post("/user/login").send({
        "username": username,
        "password": password
    });
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {utilRegister, utilLogin, sleep}