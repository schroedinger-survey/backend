require("dotenv-flow").config({
    silent: true
});
import { v4 as uuid } from "uuid";
import userDB from "../../src/db/UserDB";
import postgresDB from "../../src/drivers/PostgresDB";
const {afterAll, describe, test, expect} = require("@jest/globals");

describe("Basic tests for SQL queries of user access", () => {
    test("Test should fail for duplicate user's username", async (done) => {
        try {
            const username = uuid();
            const password = uuid();
            const email = uuid();
            const result = await userDB.register(username, password, `${email}@mail.com`);
            expect(result.length).toBe(1);
            await userDB.register(username, password, `${uuid()}@mail.com`);
            done.fail(new Error("Duplicate user name should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    test("Test should fail for duplicate user's email", async (done) => {
        try {
            const username = uuid();
            const password = uuid();
            const email = uuid();
            const result = await userDB.register(username, password, `${email}@mail.com`);
            expect(result.length).toBe(1);
            await userDB.register(uuid(), password, `${email}@mail.com`);
            done.fail(new Error("Duplicate email should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    afterAll(async (done) => {
        await postgresDB.close();
        done();
    });
});