import redisDB from "../../drivers/RedisDB";

class LastChangedPasswordDB {
    /**
     * Generate the Redis schema key for getting the last time user changed his password
     * @param userId id of the user
     * @returns {string} the redis key
     */
    private getRedisKeyLastPasswordChangeDate = (userId: string) => {
        return `LAST_PASSWORD_CHANGED_${userId.split("-").join("")}`
    }

    setLastTimeChanged = (userId: string, lastPasswordChange) => {
        return redisDB.set(this.getRedisKeyLastPasswordChangeDate(userId), lastPasswordChange);
    }

    getLastTimeChanged = (userId: string) => {
        return redisDB.get(this.getRedisKeyLastPasswordChangeDate(userId));
    }

    hasLastTimeChanged = async (userId: string) => {
        return (await redisDB.exists(this.getRedisKeyLastPasswordChangeDate(userId))) === 1
    }
}

const lastChangedPasswordDB = new LastChangedPasswordDB();
export default lastChangedPasswordDB;