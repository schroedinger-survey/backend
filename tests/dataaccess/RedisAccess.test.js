require("dotenv-flow").config({
    silent: true
});
const {test, expect} = require("@jest/globals");
const redisAccess = require("../../src/dataaccess/RedisAccess");
const {v4: uuidv4} = require("uuid");
const sqlAccess = require("../../src/dataaccess/SQLAccess");

test("Test the redis connection", async (done) => {
    const key = uuidv4();
    const value = uuidv4();
    await redisAccess.set(key, value);
    expect(await redisAccess.get(key)).toEqual(value);
    await sqlAccess.close();
    done();
});