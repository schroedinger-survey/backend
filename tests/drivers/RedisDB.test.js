require("dotenv-flow").config({
    silent: true
});
const {test, expect} = require("@jest/globals");
const redisDB = require("../../src/drivers/RedisDB");
const {v4: uuidv4} = require("uuid");

test("Test the redis connection", async (done) => {
    const key = uuidv4();
    const value = uuidv4();
    await redisDB.set(key, value);
    expect(await redisDB.get(key)).toEqual(value);

    const set = uuidv4();
    const member = uuidv4();
    expect(await redisDB.sismember(set, member)).toEqual(0);
    await redisDB.sadd(set, member);
    expect(await redisDB.sismember(set, member)).toEqual(1);

    await redisDB.close();
    done();
});