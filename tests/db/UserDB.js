require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const sqlAccess = require("../../src/drivers/PostgresDB");
const {register} = require("../../src/drivers/RedisDB");
const {v4: uuidv4} = require("uuid");

describe("Basic tests for SQL queries of user access", () => {
    test("Test should fail for duplicate user's username", async (done) => {
        try {
            const username = uuidv4();
            const password = uuidv4();
            const email = uuidv4();
            const result = await register(username, password, `${email}@mail.com`);
            expect(result.rowCount).toBe(1);
            await register(username, password, `${uuidv4()}@mail.com`);
            done.fail(new Error("Duplicate user name should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    test("Test should fail for duplicate user's email", async (done) => {
        try {
            const username = uuidv4();
            const password = uuidv4();
            const email = uuidv4();
            const result = await register(username, password, `${email}@mail.com`);
            expect(result.rowCount).toBe(1);
            await register(uuidv4(), password, `${email}@mail.com`);
            done.fail(new Error("Duplicate email should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    afterAll(async (done) => {
        await sqlAccess.close();
        done();
    });
});