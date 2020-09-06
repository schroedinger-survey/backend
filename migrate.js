require("dotenv-flow").config();
const fs = require("fs").promises;
const postgresDB = require("./src/db/PostgresDB");
const path = require("path");
const Logger = require("src/utils/Logger");

const log = Logger("Migrate");

async function initialize() {
    const files = await fs.readdir("scripts");
    files.sort();
    try {
        await postgresDB.begin();
        await postgresDB.query(`
            CREATE TABLE IF NOT EXISTS migration_scripts
            (
                id                    SERIAL PRIMARY KEY,
                migration_script_name varchar(255) NOT NULL UNIQUE,
                created               DATE         NOT NULL DEFAULT CURRENT_DATE
            );
        `);
        await postgresDB.commit();

        await postgresDB.begin();
        for (let i = 0; i < files.length; i++) {
            if (files[i].endsWith(".sql")) {
                const filePath = path.join("scripts", files[i]);
                const searchMigrationScript = {
                    name: "search-migration-script",
                    text: "SELECT * FROM migration_scripts WHERE migration_script_name =$1",
                    values: [filePath]
                };
                const checkScriptExists = await postgresDB.query(searchMigrationScript);
                if (checkScriptExists.rowCount === 0) {
                    const data = await fs.readFile(filePath, "utf-8");
                    await postgresDB.query(data);

                    const insertMigrationScript = {
                        name: "insert-migration-script",
                        text: "INSERT INTO migration_scripts(migration_script_name) values($1)",
                        values: [filePath]
                    };
                    await postgresDB.query(insertMigrationScript);
                }
            }
        }
        await postgresDB.commit();
    } catch (e) {
        await postgresDB.rollback();
        throw e;
    } finally {
        await postgresDB.close();
    }
}

initialize().then(function () {
    log.debug("Migrating database successfully.");
    process.exit(0);
}).catch(function (e) {
    log.error(e);
    process.exit(1);
});