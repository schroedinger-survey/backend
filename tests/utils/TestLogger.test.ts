require("dotenv-flow").config({
    silent: true
});
import loggerFactory from "../../src/utils/Logger";
const {describe, test} = require("@jest/globals");

describe("Basic tests for JWT", () => {
    test("Make JWT more predictable", async (done) => {
        const logger = loggerFactory.buildDebugLogger("tests/utils/TestLogger.test.ts");
        logger.info("Test")
        done();
    });
});