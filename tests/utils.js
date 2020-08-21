const utilRegister = (username, email, password) => {
    const app = require("../app");
    const supertest = require("supertest");
    const request = supertest(app);
    return request.post("/user").send({
        "username": username,
        "password": password,
        "email": email
    });
};

const utilLogin = (username, password) => {
    const app = require("../app");
    const supertest = require("supertest");
    const request = supertest(app);
    return request.post("/user/login").send({
        "username": username,
        "password": password
    });
};

module.exports = {utilRegister, utilLogin}