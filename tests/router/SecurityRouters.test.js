require("dotenv-flow").config({
    silent: true
});
const {afterAll, afterEach, beforeEach, describe, test, expect} = require("@jest/globals");
const app = require("../../app");
const supertest = require("supertest");
const sqlAccess = require("../../src/dataaccess/SQLAccess");
const {utilLogin, utilRegister} = require("../utils");
const request = supertest(app);

describe("Basic tests for the security API", () => {
    beforeEach(async (done) => {
        await sqlAccess.clearDatabase();
        done();
    });

    test("Security route should work", async (done) => {
        const resultWithoutToken = await request.get("/security");
        expect(resultWithoutToken.status).toBe(403);


        const registerUser = await utilRegister("test", "test@email.com", "test");
        expect(registerUser.status).toBe(201);

        const login = await utilLogin("test",  "test");
        expect(login.status).toBe(200);

        const obtainedToken = JSON.parse(login.text).jwt;

        const resultWithToken = await request.get("/security").set("authorization", obtainedToken);
        expect(resultWithToken.status).toBe(200);

        done();
    });

    afterEach(async (done) => {
        await sqlAccess.clearDatabase();
        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});