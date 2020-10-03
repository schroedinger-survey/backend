require("dotenv-flow").config({
    silent: true
});

import app from "../../src/app";
import { v4 as uuid } from "uuid";
const {test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);


test("SubmissionNotFoundError should be thrown for invalid submission retrieving", async (done) => {
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

    const retrievedSubmissions = await request
        .get(`/submission/${uuid()}`)
        .send()
        .set("authorization", jwt);
    expect(retrievedSubmissions.status).toEqual(404);

    await app.close();
    done();
});