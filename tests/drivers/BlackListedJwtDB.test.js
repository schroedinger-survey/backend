require("dotenv-flow").config({
    silent: true
});
const {test, expect} = require("@jest/globals");
const blackListedJwtDB = require("../../src/db/BlackListedJwtDB");
const redisDB = require("../../src/drivers/RedisDB");
const {v4: uuidv4} = require("uuid");

test("Test the redis connection", async (done) => {
    const token = uuidv4();
    expect(await blackListedJwtDB.isBlackListed(token)).toBe(false);
    await blackListedJwtDB.add(token);
    expect(await blackListedJwtDB.isBlackListed(token)).toBe(true);

    await redisDB.close();
    done();
});