require("dotenv-flow").config({
    silent: true
});
import {uuid} from "uuidv4";
import blackListedJwtDB from "../../src/db/redis/BlackListedJwtDB";
import redisDB from "../../src/drivers/RedisDB";
const {test, expect} = require("@jest/globals");

test("Test the redis connection", async (done) => {
    const token = uuid();
    expect(await blackListedJwtDB.isBlacklisted(token)).toBe(false);
    await blackListedJwtDB.blacklist(token);
    expect(await blackListedJwtDB.isBlacklisted(token)).toBe(true);

    await redisDB.close();
    done();
});