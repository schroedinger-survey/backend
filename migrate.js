require("dotenv-flow").config();
const fs = require("fs").promises;

const sqlAccess = require("./src/dataaccess/SQLAccess");


async function initialize() {
    const data = await fs.readFile("scripts/001_create_tables.sql", "utf-8");
    try {
        sqlAccess.begin();
        await sqlAccess.query(data)
        sqlAccess.commit();
    } catch (e) {
        sqlAccess.rollback();
        throw e;
    }
}

initialize();