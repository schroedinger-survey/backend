const {test, expect} = require("@jest/globals");

require("dotenv-flow").config();
const {v4: uuidv4} = require("uuid");
const sqlAccess = require("../../src/dataaccess/SQLAccess");

test("Test the database connection", async (done) => {
    const randString = uuidv4();
    const result = await sqlAccess.query(`SELECT '${randString}'`);
    expect(result.rows[0]["?column?"]).toEqual(randString);
    expect(result.rowCount).toBe(1);
    await sqlAccess.close();
    done();
});