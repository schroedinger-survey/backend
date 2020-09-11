require("dotenv-flow").config({
    silent: true
});
import loggerFactory from "../src/utils/Logger";
import elasticsearchDB from "../src/drivers/ElasticsearchDB";
const fs = require("fs").promises;
const path = require("path");

const log = loggerFactory.buildDebugLogger("scripts/indexing.ts");


async function initializeIndices() {
    const files = await fs.readdir("scripts");
    files.sort();

    for (let i = 0; i < files.length; i++) {
        if (files[i].endsWith(".json")) {
            const filePath = path.join("scripts", files[i]);
            const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
            const indexName = data.index;
            try {
                await elasticsearchDB.indices.get({
                    index: indexName
                });
                log.info(`Index ${indexName} already created`);
            } catch (e) {
                log.warn(`Index ${indexName} is missing. creating...`);
                await elasticsearchDB.indices.create({
                    index: indexName,
                    body: data.payload
                });
                log.info(`Index ${indexName} created`);
            }
        }
    }
}

initializeIndices().then(function () {
    log.debug("Initialize elasticsearch's indices successfully.");
    process.exit(0);
}).catch(function (e) {
    log.error(e);
    process.exit(1);
});
