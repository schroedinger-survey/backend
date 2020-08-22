const redisDB = require("./RedisDB");
const TTL = Number(process.env.TTL) * 1000;

class BlackListedJwtDB {
    constructor() {
        this.add = this.add.bind(this);
        this.isBlackListed = this.isBlackListed.bind(this);
    }

    async add(token) {
        return redisDB.setex(token, TTL, "BLACK_LISTED");
    }

    async isBlackListed(token) {
        return (await redisDB.exists(token)) === 1;
    }
}

const blackListedJwtDB = new BlackListedJwtDB();
module.exports = blackListedJwtDB;