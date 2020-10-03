require("dotenv-flow").config({
    silent: true
});
import elasticsearchDB from "../src/drivers/ElasticsearchDB";
const CronJob = require("cron").CronJob;
import loggerFactory from "../src/utils/Logger";

const log = loggerFactory.buildDebugLogger("schroedinger-cron.ts");


/**
 * Cleaning Elasticsearch
 * GET _cat/indices?v
 */
new CronJob("0 0 * * * *", async () => {
    log.info("Start rotating elasticsearch logs");
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await elasticsearchDB.indices.delete({index: `metricbeat-7.9.1-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}*`});
    await elasticsearchDB.indices.delete({index: `.monitoring-es-7-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}*`});
    await elasticsearchDB.indices.delete({index: `.monitoring-kibana-7-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}*`});
}).start();
