const redisDB = require("../drivers/RedisDB");

class LastTimeUserChangedPasswordDB {
    constructor() {
        this.setLastTimeChanged = this.setLastTimeChanged.bind(this);
        this.getRedisKeyLastPasswordChangeDate = this.getRedisKeyLastPasswordChangeDate.bind(this);
        this.getLastTimeChanged = this.getLastTimeChanged.bind(this);
    }

    /**
     * Generate the Redis schema key for getting the last time user changed his password
     * @param userId id of the user
     * @returns {string} the redis key
     */
    getRedisKeyLastPasswordChangeDate(userId) {
        return `LAST_PASSWORD_CHANGED_${userId.split("-").join("")}`
    }

    async setLastTimeChanged(userId, lastPasswordChange) {
        return await redisDB.set(this.getRedisKeyLastPasswordChangeDate(userId), lastPasswordChange);
    }

    async getLastTimeChanged(userId) {
        return await redisDB.get(this.getRedisKeyLastPasswordChangeDate(userId));
    }

    async lastTimeChangedExists(userId) {
        return (await redisDB.exists(this.getRedisKeyLastPasswordChangeDate(userId))) === 1
    }
}

const lastTimeUserChangedPasswordDB = new LastTimeUserChangedPasswordDB();
module.exports = lastTimeUserChangedPasswordDB;