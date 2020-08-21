require("dotenv-flow").config({
    silent: true
});
const {test, expect} = require("@jest/globals");
const redisDB = require("../../src/db/RedisDB");
const {v4: uuidv4} = require("uuid");

test("Test the redis connection", async (done) => {
    const key = uuidv4();
    const value = uuidv4();
    await redisDB.set(key, value);
    expect(await redisDB.get(key)).toEqual(value);
    await redisDB.close();
    done();
});