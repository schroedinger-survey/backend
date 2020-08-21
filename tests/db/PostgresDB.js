require("dotenv-flow").config({
    silent: true
});
const {test, expect} = require("@jest/globals");
const {v4: uuidv4} = require("uuid");
const postgresDB = require("../../src/db/PostgresDB");

test("Test the database connection", async (done) => {
    const randString = uuidv4();
    const result = await postgresDB.query(`SELECT '${randString}'`);
    expect(result.rows[0]["?column?"]).toEqual(randString);
    expect(result.rowCount).toBe(1);
    await postgresDB.close();
    done();
});