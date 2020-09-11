import loggerFactory from "../utils/Logger";

const httpContext = require("express-http-context");
const redis = require("redis");
const {promisify} = require("util");

const log = loggerFactory.buildDebugLogger("src/drivers/RedisDB.js");

class RedisDB {
    private client;
    private _getAsync;
    private _setAsync;
    private _quit;
    private _saddAsync;
    private _setexAsync;
    private _sismemberAsync;
    private _existsAsync;

    constructor() {
        this.createClient();
    }

    createClient = () => {
        httpContext.set("method", "createClient");
        if (!this.client || this.client.closing) {
            try {
                log.debug(`Redis connection: ${process.env.REDIS_HOST}`)
                const config = {port: 6379, host: process.env.REDIS_HOST, password: undefined};
                if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
                    config.password = process.env.REDIS_PASSWORD
                }
                this.client = redis.createClient(config);

                this._getAsync = promisify(this.client.get).bind(this.client);
                this._setAsync = promisify(this.client.set).bind(this.client);
                this._quit = promisify(this.client.quit).bind(this.client);

                this._saddAsync = promisify(this.client.sadd).bind(this.client);
                this._setexAsync = promisify(this.client.setex).bind(this.client);
                this._sismemberAsync = promisify(this.client.sismember).bind(this.client);
                this._existsAsync = promisify(this.client.exists).bind(this.client);

                this.client.on("connect", function (error) {
                    if (error) {
                        log.error(error)
                        process.exit(1);
                    }
                    log.debug("Redis client connected");
                });
            } catch (e) {
                log.error(e);
                throw e;
            }
        }
    }

    setex = (key, ttl, value) => {
        return this._setexAsync(key, ttl, value)
    }

    exists = (key) => {
        return this._existsAsync(key)
    }

    sadd = (setName, item) => {
        return this._saddAsync(setName, item);
    }

    sismember = (setName, item) => {
        return this._sismemberAsync(setName, item);
    }

    get = (key) => {
        return this._getAsync(key)
    }

    set = (key, value) => {
        return this._setAsync(key, value)
    }

    close = () => {
        return this._quit()
    }
}

const redisDB = new RedisDB();
export default redisDB;