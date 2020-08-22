const {afterAll, describe, test, expect} = require("@jest/globals");
const atob = require("atob");
const {v4: uuidv4} = require("uuid");

require("dotenv-flow").config({
    silent: true
});
const app = require("../../app");
const supertest = require("supertest");
const request = supertest(app);

describe("Basic tests for the API", () => {
    test("The API for user registration should work", async (done) => {
        const a1 = uuidv4();
        const a2 = uuidv4();
        const a3 = uuidv4();
        const password = uuidv4();

        const result = await request.post("/user").send({
            "username": a1,
            "password": password,
            "email": `${a1}@email.com`
        });
        expect(result.status).toBe(201);

        const duplicateUsername = await request.post("/user").send({
            "username": a1,
            "password": password,
            "email": `${a2}@email.com`
        });
        expect(duplicateUsername.status).toBe(409);

        const duplicateMail = await request.post("/user").send({
            "username": a3,
            "password": password,
            "email": `${a1}@email.com`
        });
        expect(duplicateMail.status).toBe(409);

        const noUsername = await request.post("/user").send({
            "password": "b3",
            "email": "c1@email.com"
        });
        expect(noUsername.status).toBe(422);

        const noMail = await request.post("/user").send({
            "username": "c3",
            "password": "b3"
        });
        expect(noMail.status).toBe(422);

        const noPassword = await request.post("/user").send({
            "username": "c3",
            "email": "c1@email.com"
        });
        expect(noPassword.status).toBe(422);
        done();
    });

    test("The API for user login should work", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await request.post("/user").send({
            "username": username,
            "password": password,
            "email": `${email}@mail.com`
        });
        expect(registerUser.status).toBe(201);

        const loginUser = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        const jwtParts = loginUser.body.jwt.split(".");
        const tokenPayload = JSON.parse(atob(jwtParts[1]));
        expect(loginUser.body.hasOwnProperty("jwt")).toBe(true);
        expect(jwtParts.length).toBe(3);
        expect(tokenPayload.hasOwnProperty("id")).toBe(true);
        expect(tokenPayload.hasOwnProperty("username")).toBe(true);
        expect(tokenPayload.hasOwnProperty("exp")).toBe(true);
        expect(tokenPayload.hasOwnProperty("iat")).toBe(true);
        expect(tokenPayload.hasOwnProperty("hashed_password")).toBe(false);
        expect(tokenPayload.hasOwnProperty("email")).toBe(false);
        expect(tokenPayload.username).toBe(username);
        expect(tokenPayload.exp > tokenPayload.iat).toBe(true);
        expect(tokenPayload.exp).toEqual(tokenPayload.iat + Number(process.env.TTL));
        expect(loginUser.status).toBe(200);

        const wrongPassword = await request.post("/user/login").send({
            "username": username,
            "password": "wrongpassword"
        });
        expect(wrongPassword.status).toBe(403);

        const wrongUsername = await request.post("/user/login").send({
            "username": "wrongname",
            "password": password
        });
        expect(wrongUsername.status).toBe(404);

        done();
    });

    test("The API for user login should work", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await request.post("/user").send({
            "username": username,
            "password": password,
            "email": `${email}@mail.com`
        });
        expect(registerUser.status).toBe(201);

        const loginUser = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        const jwt = loginUser.body.jwt;

        const userInfo = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo.status).toBe(200);
        expect(userInfo.body.hasOwnProperty("id")).toBe(true);
        expect(userInfo.body.hasOwnProperty("username")).toBe(true);
        expect(userInfo.body.hasOwnProperty("created")).toBe(true);
        expect(userInfo.body.hasOwnProperty("email")).toBe(true);
        expect(userInfo.body.hasOwnProperty("hashed_password")).toBe(false);

        done();
    });

    test("The API for user login and logout should work", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await request.post("/user").send({
            "username": username,
            "password": password,
            "email": `${email}@mail.com`
        });
        expect(registerUser.status).toBe(201);

        const loginUser = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        expect(loginUser.status).toBe(200);
        const jwt = loginUser.body.jwt;

        const logoutUser = await request.post("/user/logout").set("authorization", jwt);
        expect(logoutUser.status).toBe(204);

        const userInfo = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo.status).toBe(403);

        done();
    });


    afterAll(async (done) => {
        await app.close();
        done();
    });
})