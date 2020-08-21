require("dotenv-flow").config();
const fs = require("fs").promises;
const log = require("./src/log/Logger");
const sqlAccess = require("./src/dataaccess/SQLAccess");
const path = require("path");

async function initialize() {
    const files = await fs.readdir("scripts");
    files.sort();
    try {
        await sqlAccess.begin();
        await sqlAccess.query(`
            CREATE TABLE IF NOT EXISTS migration_scripts
            (
                id                    SERIAL PRIMARY KEY,
                migration_script_name varchar(255) NOT NULL UNIQUE,
                created               DATE         NOT NULL DEFAULT CURRENT_DATE
            );
        `);
        await sqlAccess.commit();

        await sqlAccess.begin();
        for (let i = 0; i < files.length; i++) {
            if (files[i].endsWith(".sql")) {
                const filePath = path.join("scripts", files[i]);
                const searchMigrationScript = {
                    name: "search-migration-script",
                    text: "SELECT * FROM migration_scripts WHERE migration_script_name =$1",
                    values: [filePath]
                };
                const checkScriptExists = await sqlAccess.query(searchMigrationScript);
                if (checkScriptExists.rowCount === 0) {
                    const data = await fs.readFile(filePath, "utf-8");
                    await sqlAccess.query(data);

                    const insertMigrationScript = {
                        name: "insert-migration-script",
                        text: "INSERT INTO migration_scripts(migration_script_name) values($1)",
                        values: [filePath]
                    };
                    await sqlAccess.query(insertMigrationScript);
                }
            }
        }
        await sqlAccess.commit();
    } catch (e) {
        await sqlAccess.rollback();
        throw e;
    } finally {
        await sqlAccess.close();
    }
}

initialize().then(function () {
    log.debug("Migrating database successfully.");
    process.exit(0);
}).catch(function (e) {
    log.error(e);
    process.exit(1);
});