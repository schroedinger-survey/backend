require("dotenv-flow").config({
    silent: true
});
import app from "../src/app";
const supertest = require("supertest");
const request = supertest(app);

class TestUtils {
    utilRegister = (username, email, password) => {
        return request.post("/user").send({
            "username": username,
            "password": password,
            "email": email
        });
    };

    utilLogin = (username, password) => {
        return request.post("/user/login").send({
            "username": username,
            "password": password
        });
    };

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const testUtils = new TestUtils();
export default testUtils;