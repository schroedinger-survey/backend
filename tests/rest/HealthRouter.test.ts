require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
const {test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);

test("Health route should work", async (done) => {
    const result = await request.get("/health");
    expect(result.status).toBe(200);
    await app.close();
    done();
});