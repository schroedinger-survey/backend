const {Client} = require("@elastic/elasticsearch")
const opts = {
    node: `http://${process.env.ELASTIC_HOST}:9200`
};

if (process.env.ELASTIC_PASSWORD && process.env.ELASTIC_PASSWORD.length > 0) {
    opts.auth = {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD
    }
}
const elasticsearchDB = new Client(opts)

module.exports = elasticsearchDB;