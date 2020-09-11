require("dotenv-flow").config({
    silent: true
});
import {uuid} from "uuidv4";
import blackListedJwtDB from "../../src/db/cache/BlackListedJwtDB";
import redisDB from "../../src/drivers/RedisDB";
const {test, expect} = require("@jest/globals");

test("Test the redis connection", async (done) => {
    const token = uuid();
    expect(await blackListedJwtDB.isBlackListed(token)).toBe(false);
    await blackListedJwtDB.add(token);
    expect(await blackListedJwtDB.isBlackListed(token)).toBe(true);

    await redisDB.close();
    done();
});