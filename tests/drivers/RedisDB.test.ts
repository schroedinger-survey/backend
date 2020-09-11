require("dotenv-flow").config({
    silent: true
});
import {uuid} from "uuidv4";
import redisDB from "../../src/drivers/RedisDB";
const {test, expect} = require("@jest/globals");

test("Test the redis connection", async (done) => {
    const key = uuid();
    const value = uuid();
    await redisDB.set(key, value);
    expect(await redisDB.get(key)).toEqual(value);

    const set = uuid();
    const member = uuid();
    expect(await redisDB.sismember(set, member)).toEqual(0);
    await redisDB.sadd(set, member);
    expect(await redisDB.sismember(set, member)).toEqual(1);

    await redisDB.close();
    done();
});