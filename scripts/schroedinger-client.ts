import loggerFactory from "../src/utils/Logger";

require("dotenv-flow").config({
    silent: true
});
import jsonWebToken from "../src/utils/JsonWebToken";

const log = loggerFactory.buildDebugLogger("schroedinger-client.ts");

const io = require("socket.io-client");
const id = "01EKR4WK7NJ7706DQ940F75040";
const username = "01EKR4WPCEQ4BZ5XB1ZTBDKYF2";
const socket = io("http://localhost:3002/notification", {
    path: "/schroedinger-socket-path",
    query: {
        authorization: jsonWebToken.sign({id: id, username: username})
    }
});
socket.on("debug", (data) => {
    log.info(`Connected ${data}`);
});
socket.on(`new-submission/${id}`, (data) => {
    log.info(data);
});
socket.on("disconnect", (data) => {
    log.info(data);
    socket.close();
});

