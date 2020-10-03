require("dotenv-flow").config({
    silent: true
});
import forgotPasswordDB from "../../src/db/ForgotPasswordTokenDB";
import app from "../../src/app";
import { v4 as uuid } from "uuid";
import testUtils from "../TestUtils";
const {test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);


test("NoResetPasswordTokenFoundError should be thrown with no token on secured path", async (done) => {
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
        "email": `${email}@mail.com`
    });
    expect(requestingEmail1.status).toBe(200);

    const token2 = await forgotPasswordDB.getForgotPasswordTokenByUserId(userInfo1.body.id);
    expect(token2.length).toBe(1);

    await testUtils.changedPasswordBufferSleep();

    const newPassword = uuid();
    const passwordChanged1 = await request.put("/user/password/reset").send({
        "reset_password_token": uuid(),
        "new_password": newPassword
    });
    expect(passwordChanged1.status).toBe(400);

    await app.close();
    done();
});