require("dotenv-flow").config();
const fs = require("fs").promises;

const sqlAccess = require("./src/dataaccess/SQLAccess");

async function initialize() {
    const data = await fs.readFile("scripts/001_create_tables.sql", "utf-8");
    try {
        await sqlAccess.begin();
        await sqlAccess.query(data)
        await sqlAccess.commit();
    } catch (e) {
        await sqlAccess.rollback();
        throw e;
    } finally {
        await sqlAccess.close();
    }
}

initialize().then(function (){
    process.exit(0);
}).catch(function(e){
    throw e;
});