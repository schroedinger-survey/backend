require("dotenv-flow").config({
    silent: true
});
import jsonWebToken from "../../src/utils/JsonWebToken";

const {describe, test} = require("@jest/globals");

describe("Basic tests for JWT", () => {
    test("Make JWT more predictable", async (done) => {
        const token = await jsonWebToken.sign({"test": "test"});
        await jsonWebToken.verify(token);
        done();
    });
});