import testUtils from "../TestUtils";

require("dotenv-flow").config({
    silent: true
});
import jsonWebToken from "../../src/utils/JsonWebToken";
import SchroedingerTimeStamp from "../../src/utils/SchroedingerTimeStamp";

const {describe, test, expect} = require("@jest/globals");

describe("Basic tests for JWT", () => {
    test("Make JWT more predictable", async (done) => {
        const current = SchroedingerTimeStamp.currentUTCMsTimeStamp();
        const token = await jsonWebToken.sign({"test": "test"});
        const payload = jsonWebToken.verify(token);
        expect(Math.abs(current - payload.issued_at_utc) < 2).toBe(true);
        done();
    });
});