const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const log = require("./src/log/Logger");
const sqlAccess = require("./src/dataaccess/SQLAccess");

async function initialize() {
    log.debug("Start initializing database")
    const files = await fs.readdir("scripts");
    files.sort();
    try {
        sqlAccess.begin();
        for (let i = 0; i < files.length; i++) {
            const filePath = path.join("scripts", files[i]);
            log.debug("Initialize current file ", filePath)
            const data = await fs.readFile(filePath, "utf-8");
            await sqlAccess.initialize(data);
            log.debug("Migrated successfully file: ", filePath);
        }
        sqlAccess.commit();
    } catch (e) {
        sqlAccess.rollback();
        log.debug("Files could not be migrated", e.message);
        throw e;
    }
}
initialize();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

module.exports = app;