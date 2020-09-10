require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const sqlAccess = require("../../src/drivers/PostgresDB");
const forgotPasswordDB = require("../../src/db/ForgotPasswordTokenDB");
const userDB = require("../../src/db/UserDB");
const queryConvert = require("../../src/utils/QueryConverter");
const {v4: uuidv4} = require("uuid");

describe("Basic tests for forgot password DB", () => {
    test("Creating new forgot password db", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const result = await userDB.register(username, password, `${email}@mail.com`);
        expect(result.rowCount).toBe(1);
        const query = await forgotPasswordDB.createForgotPasswordToken(result.rows[0].id);
        const tokens = queryConvert(query);
        expect(tokens.length).toBe(1);
        done();
    });

    afterAll(async (done) => {
        await sqlAccess.close();
        done();
    });
});