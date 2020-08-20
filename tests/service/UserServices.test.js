const {afterAll, afterEach, beforeEach, describe, test, expect} = require("@jest/globals");
const atob = require("atob");

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
        const result = await request.post("/api/user").send({
            "username": "a1",
            "password": "b1",
            "email": "c1"});
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

    test("The API for user login should work", async(done) => {
        const registerUser = await request.post("/api/user").send({
           "username": "test",
           "password": "testpassword",
           "email": "testmail"
        });
        expect(registerUser.status).toBe(201);

        const loginUser = await request.post("/api/user/login").send({
            "username": "test",
            "password": "testpassword"
        });
        const jwtParts = loginUser.body.jwt.split(".");
        const tokenPayload = JSON.parse(atob(jwtParts[1]));
        expect(loginUser.body.hasOwnProperty("jwt")).toBe(true);
        expect(jwtParts.length).toBe(3);
        expect(tokenPayload.hasOwnProperty("id")).toBe(true);
        expect(tokenPayload.hasOwnProperty("username")).toBe(true);
        expect(tokenPayload.hasOwnProperty("exp")).toBe(true);
        expect(tokenPayload.hasOwnProperty("iat")).toBe(true);
        expect(tokenPayload.username).toBe("test");
        expect(tokenPayload.exp > tokenPayload.iat).toBe(true);
        expect(tokenPayload.exp).toEqual(tokenPayload.iat+Number(process.env.TTL));
        expect(loginUser.status).toBe(200);

        const wrongPassword = await request.post("/api/user/login").send({
            "username": "test",
            "password": "wrongpassword"
        });
        expect(wrongPassword.status).toBe(403);

        const wrongUsername = await request.post("/api/user/login").send({
            "username": "wrongname",
            "password": "testpassword"
        });
        expect(wrongUsername.status).toBe(404);

        done();
    })


    afterEach(async (done) => {
        await sqlAccess.clearDatabase();
        done();
    });

    afterAll(async (done) => {
        await sqlAccess.close();
        done();
    });
})