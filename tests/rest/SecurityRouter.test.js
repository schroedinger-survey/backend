require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const app = require("../../app");
const supertest = require("supertest");
const {v4: uuidv4} = require("uuid");
const {utilLogin, utilRegister} = require("../utils");
const request = supertest(app);

describe("Basic tests for the security API", () => {
    test("Security route should work against unauthorized", async (done) => {
        const result1 = await request.get("/security");
        expect(result1.status).toBe(403);

        const result2 = await request.get("/security").set("authorization", uuidv4());
        expect(result2.status).toBe(403);
        done();
    });

    test("Security route should work with authorized", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await utilLogin(username,  password);
        expect(login.status).toBe(200);

        const obtainedToken = JSON.parse(login.text).jwt;

        const result = await request.get("/security").set("authorization", obtainedToken);
        expect(result.status).toBe(200);
        const resultBody = JSON.parse(result.text);
        expect(resultBody.id !== null);
        expect(resultBody.username).toEqual(username);
        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});