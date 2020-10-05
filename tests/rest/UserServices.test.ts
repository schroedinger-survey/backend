require("dotenv-flow").config({
    silent: true
});

import app from "../../src/app";
import { v4 as uuid } from "uuid";
import authorization from "../../src/middleware/Authorization";
import testUtils from "../TestUtils";
import forgotPasswordDB from "../../src/data/sql/ForgotPasswordTokenDB";
import jsonWebToken from "../../src/utils/JsonWebToken";
const {afterAll, describe, test, expect} = require("@jest/globals");
const atob = require("atob");
const supertest = require("supertest");
const request = supertest(app);

describe("Basic tests for the API", () => {
    test("The API for user registration should work", async (done) => {
        const a1 = uuid();
        const a2 = uuid();
        const a3 = uuid();
        const password = uuid();

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
        const username = uuid();
        const password = uuid();
        const email = uuid();
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
        expect(tokenPayload.exp).toEqual(tokenPayload.iat + Number(process.env.SCHROEDINGER_JWT_TTL));
        expect(loginUser.status).toBe(200);

        const wrongPassword = await request.post("/user/login").send({
            "username": username,
            "password": "wrongpassword"
        });
        expect(wrongPassword.status).toBe(404);

        const wrongUsername = await request.post("/user/login").send({
            "username": "wrongname",
            "password": password
        });
        expect(wrongUsername.status).toBe(404);

        done();
    });

    test("The API for user login should work", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
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
        const username = uuid();
        const password = uuid();
        const email = uuid();
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

        const loginUserWithEmail = await request.post("/user/login").send({
            "username": `${email}@mail.com`,
            "password": password
        });
        expect(loginUserWithEmail.status).toBe(200);

        await testUtils.changedPasswordBufferSleep();

        const logoutUser = await request.post("/user/logout").set("authorization", jwt);
        expect(logoutUser.status).toBe(204);

        const userInfo = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo.status).toBe(403);

        done();
    });

    test("The API for changing user's information shall work", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await request.post("/user").send({
            "username": username,
            "password": password,
            "email": `${email}@mail.com`
        });
        expect(registerUser.status).toBe(201);

        const loginUser1 = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        expect(loginUser1.status).toBe(200);
        const jwt = loginUser1.body.jwt;

        const userInfo1 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo1.status).toBe(200);

        const newPassword = uuid();
        const changeUserPassword1 = await request.put("/user").send({
            "old_password": uuid(),
            "new_password": newPassword
        }).set("authorization", jwt);
        expect(changeUserPassword1.status).toBe(404);
        expect((await authorization.isJwtTokenValid(jwt)).valid).toBe(true);

        const newUserName = uuid();
        const changeUsername = await request.put("/user").send({
            "old_password": password,
            "username": newUserName
        }).set("authorization", jwt);
        expect(changeUsername.status).toBe(204);
        expect((await authorization.isJwtTokenValid(jwt)).valid).toBe(true);

        const userInfo2 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo1.status).toBe(200);
        expect(userInfo2.body.username).toEqual(newUserName);

        const newEmail = uuid();
        const changeEmail = await request.put("/user").send({
            "old_password": password,
            "email": newEmail
        }).set("authorization", jwt);
        expect(changeEmail.status).toBe(204);
        expect((await authorization.isJwtTokenValid(jwt)).valid).toBe(true);

        const userInfo3 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo3.status).toBe(200);
        expect(userInfo3.body.email).toEqual(newEmail);

        await testUtils.changedPasswordBufferSleep();

        const changePassword = await request.put("/user").send({
            "old_password": password,
            "new_password": newPassword
        }).set("authorization", jwt);
        expect(changePassword.status).toBe(204);
        expect((await authorization.isJwtTokenValid(jwt)).valid).toBe(false);

        const userInfo4 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo4.status).toBe(403);


        const loginUser2 = await request.post("/user/login").send({
            "username": newUserName,
            "password": newPassword
        });
        expect(loginUser2.status).toBe(200);
        const jwt2 = loginUser2.body.jwt;

        const userInfo5 = await request.post("/user/info").set("authorization", jwt2);
        expect(userInfo5.status).toBe(200);

        done();
    });


    test("API for requesting password resetting email should work with username", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await request.post("/user").send({
            "username": username,
            "password": password,
            "email": `${email}@mail.com`
        });
        expect(registerUser.status).toBe(201);

        const loginUser1 = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        expect(loginUser1.status).toBe(200);
        const jwt = loginUser1.body.jwt;

        const userInfo1 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo1.status).toBe(200);

        const token1 = await forgotPasswordDB.getForgotPasswordTokenByUserId(userInfo1.body.id);
        expect(token1.length).toBe(0);

        const requestingEmail1 = await request.post("/user/password/reset").send({
            "username": username
        });
        expect(requestingEmail1.status).toBe(200);

        const token2 = await forgotPasswordDB.getForgotPasswordTokenByUserId(userInfo1.body.id);
        expect(token2.length).toBe(1);

        await testUtils.changedPasswordBufferSleep();

        const newPassword = uuid();
        const passwordChanged1 = await request.put("/user/password/reset").send({
            "reset_password_token": token2[0].id,
            "new_password": newPassword
        });
        expect(passwordChanged1.status).toBe(204);

        const loginUser2 = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        expect(loginUser2.status).toBe(404);

        const userInfo2 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo2.status).toBe(403);


        const loginUser3 = await request.post("/user/login").send({
            "username": username,
            "password": newPassword
        });
        expect(loginUser3.status).toBe(200);
        const jwt2 = loginUser3.body.jwt;

        const userInfo3 = await request.post("/user/info").set("authorization", jwt2);
        expect(userInfo3.status).toBe(200);


        done();
    });

    test("API for requesting password resetting email should work with email", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const loginUser1 = await testUtils.loginUser(username, password);
        expect(loginUser1.status).toBe(200);
        const oldJwt = loginUser1.body.jwt;

        const userInfo1 = await request.post("/user/info").set("authorization", oldJwt);
        expect(userInfo1.status).toBe(200);

        const token1 = await forgotPasswordDB.getForgotPasswordTokenByUserId(userInfo1.body.id);
        expect(token1.length).toBe(0);

        const requestingEmail1 = await request.post("/user/password/reset").send({
            "email": `${email}@mail.com`
        });
        expect(requestingEmail1.status).toBe(200);

        const token2 = await forgotPasswordDB.getForgotPasswordTokenByUserId(userInfo1.body.id);
        expect(token2.length).toBe(1);

        await testUtils.changedPasswordBufferSleep();

        const newPassword = uuid();
        const passwordChanged1 = await request.put("/user/password/reset").send({
            "reset_password_token": token2[0].id,
            "new_password": newPassword
        });
        expect(passwordChanged1.status).toBe(204);
        const loginUser2 = await request.post("/user/login").send({
            "username": username,
            "password": password
        });
        expect(loginUser2.status).toBe(404);

        const tokenPayload = jsonWebToken.unsecuredGetPayload(oldJwt);
        expect(tokenPayload.id).toBe(userInfo1.body.id);
        const userInfo2 = await request.post("/user/info").set("authorization", oldJwt);
        expect(userInfo2.status).toBe(403);

        const loginUser3 = await request.post("/user/login").send({
            "username": username,
            "password": newPassword
        });
        expect(loginUser3.status).toBe(200);
        const newJwt = loginUser3.body.jwt;

        const userInfo3 = await request.post("/user/info").set("authorization", newJwt);
        expect(userInfo3.status).toBe(200);


        done();
    });

    test("API for deleting user account should work", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = `${uuid()}@mail.com`
        const registerUser = await testUtils.registerUser(username, email, password);
        expect(registerUser.status).toBe(201);

        const loginUser1 = await testUtils.loginUser(username, password);
        expect(loginUser1.status).toBe(200);
        const jwt = loginUser1.body.jwt;

        const userInfo1 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo1.status).toBe(200);

        const deleteUser0 = await request.delete("/user").send({
            "user_id": userInfo1.body.id,
            "password": uuid()
        }).set("authorization", jwt);
        expect(deleteUser0.status).toBe(404);

        const deleteUser1 = await request.delete("/user").send({
            "user_id": userInfo1.body.id,
            "password": password
        }).set("authorization", jwt);
        expect(deleteUser1.status).toBe(200);

        const deleteUser2 = await request.delete("/user").send({
            "user_id": userInfo1.body.id,
            "password": password
        }).set("authorization", jwt);
        expect(deleteUser2.status).toBe(403);

        const userInfo2 = await request.post("/user/info").set("authorization", jwt);
        expect(userInfo2.status).toBe(403);

        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
})