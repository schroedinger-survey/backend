const redis = require("redis");
const log = require("../log/Logger");
const {promisify} = require("util");

class RedisAccess {
    constructor() {
        this.createClient();
    }

    createClient() {
        if (!this.client || this.client.closing) {
            try {
                log.debug(`Redis connection information ${process.env.REDIS_HOST}`)
                const config = {};
                config.port = 6379
                config.host = process.env.REDIS_HOST
                if(process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0){
                    config.password = process.env.REDIS_PASSWORD
                }
                this.client = redis.createClient(config);
                this._getAsync = promisify(this.client.get).bind(this.client);
                this._setAsync = promisify(this.client.set).bind(this.client);
                this._quit = promisify(this.client.quit).bind(this.client);
                this.client.on("connect", function (error) {
                    if (error) {
                        log.error(error)
                        process.exit(1);
                    }
                    log.debug("Redis client connected");
                });
            }catch (e){
                log.error(e);
                throw e;
            }
        }
    }

    get(key) {
        return this._getAsync(key)
    }

    set(key, value) {
        return this._setAsync(key, value)
    }

    close() {
        return this._quit()
    }
}

const redisAccess = new RedisAccess();
module.exports = redisAccess;