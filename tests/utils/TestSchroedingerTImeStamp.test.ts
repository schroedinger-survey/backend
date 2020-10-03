import SchroedingerTimeStamp from "../../src/utils/SchroedingerTimeStamp";
const {describe, test, expect} = require("@jest/globals");

describe("Basic tests for JWT", () => {
    test("Make JWT more predictable", async (done) => {
        const timestamp = SchroedingerTimeStamp.currentUTCMsTimeStamp();
        const date1 = SchroedingerTimeStamp.currentUTCDate();
        const date2 = SchroedingerTimeStamp.msTimeStampToDate(date1.getTime());
        const date3 = SchroedingerTimeStamp.msTimeStampToDate(timestamp);
        expect(Math.abs(date1.getTime() - date2.getTime()) < 2).toBe(true);
        expect(Math.abs(date2.getTime() - date3.getTime()) < 2).toBe(true);
        expect(Math.abs(date1.getTime() - date3.getTime()) < 2).toBe(true);
        done();
    });
});