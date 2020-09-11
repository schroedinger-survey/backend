import redisDB from "../../drivers/RedisDB";

class LastTimeUserChangedPasswordDB {
    /**
     * Generate the Redis schema key for getting the last time user changed his password
     * @param userId id of the user
     * @returns {string} the redis key
     */
    getRedisKeyLastPasswordChangeDate = (userId)  => {
        return `LAST_PASSWORD_CHANGED_${userId.split("-").join("")}`
    }

    setLastTimeChanged = (userId, lastPasswordChange) => {
        return redisDB.set(this.getRedisKeyLastPasswordChangeDate(userId), lastPasswordChange);
    }

    getLastTimeChanged = (userId) => {
        return redisDB.get(this.getRedisKeyLastPasswordChangeDate(userId));
    }

    lastTimeChangedExists = async (userId) => {
        return (await redisDB.exists(this.getRedisKeyLastPasswordChangeDate(userId))) === 1
    }
}

const lastTimeUserChangedPasswordDB = new LastTimeUserChangedPasswordDB();
export default lastTimeUserChangedPasswordDB;