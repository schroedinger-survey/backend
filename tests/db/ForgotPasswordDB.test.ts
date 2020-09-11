require("dotenv-flow").config({
    silent: true
});
import {uuid} from "uuidv4";
import userDB from "../../src/db/sql/UserDB";
import forgotPasswordDB from "../../src/db/sql/ForgotPasswordTokenDB";
import postgresDB from "../../src/drivers/PostgresDB";
const {afterAll, describe, test, expect} = require("@jest/globals");

describe("Basic tests for forgot password DB", () => {
    test("Creating new forgot password db", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const result = await userDB.register(username, password, `${email}@mail.com`);
        expect(result.length).toBe(1);
        const query = await forgotPasswordDB.createForgotPasswordToken(result[0].id);
        expect(query.length).toBe(1);
        done();
    });

    afterAll(async (done) => {
        await postgresDB.close();
        done();
    });
});