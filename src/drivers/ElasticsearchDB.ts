const {Client} = require("@elastic/elasticsearch");

const opts = {
    node: `http://${process.env.ELASTIC_HOST}`
};

const elasticsearchDB = new Client(opts)
export default elasticsearchDB;
export {opts};