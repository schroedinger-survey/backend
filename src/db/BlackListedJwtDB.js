const redisDB = require("./RedisDB");

class BlackListedJwtDB {
    constructor() {
        this.add = this.add.bind(this);
        this.isBlackListed = this.isBlackListed.bind(this);
    }

    async add(token) {
        return redisDB.sadd("BLACK_LIST_JWT", token);
    }

    async isBlackListed(token) {
        return (await redisDB.sismember("BLACK_LIST_JWT", token)) === 1;
    }
}

const blackListedJwtDB = new BlackListedJwtDB();
module.exports = blackListedJwtDB;