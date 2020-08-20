const {afterAll, afterEach, beforeEach, describe, test, expect} = require("@jest/globals");

require("dotenv-flow").config();
const sqlAccess = require("../../src/dataaccess/SQLAccess");
const {register} = require("../../src/dataaccess/UserDataAccess");

describe("Basic tests for SQL queries of user access", () => {
    beforeEach(async (done) => {
        await sqlAccess.begin();
        done();
    });

    test("Test should fail for duplicate user's username", async (done) => {
        try {
            const result = await register("test1", "password", "test1@mail.com");
            expect(result.rowCount).toBe(1);
            await register("test1", "password", "test2@mail.com");
            done.fail(new Error("Duplicate user name should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    test("Test should fail for duplicate user's email", async (done) => {
        try {
            const result = await register("test3", "password", "test3@mail.com");
            expect(result.rowCount).toBe(1);
            await register("test4", "password", "test3@mail.com");
            done.fail(new Error("Duplicate email should throw exception. This statement should not be reached."));
        } catch (e) {
            done();
        }
    });

    afterEach(async (done) => {
        await sqlAccess.rollback();
        done();
    });

    afterAll(async (done) => {
        await sqlAccess.close();
        done();
    });
});