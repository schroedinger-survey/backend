require("dotenv-flow").config({
    silent: true
});
import { v4 as uuid } from "uuid";
import postgresDB from "../../../src/data/drivers/PostgresDB";
const {test, expect} = require("@jest/globals");

test("Test the database connection", async (done) => {
    const randString = uuid();
    const result = await postgresDB.query(`SELECT '${randString}'`);
    expect(result.rows[0]["?column?"]).toEqual(randString);
    expect(result.rowCount).toBe(1);
    await postgresDB.close();
    done();
});