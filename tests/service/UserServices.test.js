const {afterAll, afterEach, beforeEach, describe, test, expect} = require("@jest/globals");

require("dotenv-flow").config();
const sqlAccess = require("../../src/dataaccess/SQLAccess");
const app = require("../../app");
const supertest = require("supertest");
const request = supertest(app);

describe("Basic tests for the API", () => {

    beforeEach(async (done) => {
        await sqlAccess.clearDatabase();
        done();
    });

    test("The API for user registration should work", async (done) => {
        const result = await request.post("/api/user").send({"username": "a1", "password": "b1", "email": "c1"});
        expect(result.status).toBe(201);

        const duplicateUsername = await request.post("/api/user").send({
            "username": "a1",
            "password": "b2",
            "email": "c2"
        });
        expect(duplicateUsername.status).toBe(409);

        const duplicateMail = await request.post("/api/user").send({
            "username": "c3",
            "password": "b3",
            "email": "c1"
        });
        expect(duplicateMail.status).toBe(409);

        const noUsername = await request.post("/api/user").send({
            "password": "b3",
            "email": "c1"
        });
        expect(noUsername.status).toBe(422);

        const noMail = await request.post("/api/user").send({
            "username": "c3",
            "password": "b3"
        });
        expect(noMail.status).toBe(422);

        const noPassword = await request.post("/api/user").send({
            "username": "c3",
            "email": "c1"
        });
        expect(noPassword.status).toBe(422);

        done();
    });

    afterEach(async (done) => {
        await sqlAccess.query("DELETE FROM users");
        done();
    });

    afterAll(async (done) => {
        await sqlAccess.close();
        done();
    });
})