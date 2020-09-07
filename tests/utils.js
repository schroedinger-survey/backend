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

module.exports = {utilRegister, utilLogin}