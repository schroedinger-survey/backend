import lastChangedPasswordDB from "../db/redis/LastChangedPasswordDB";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";

const log = loggerFactory.buildDebugLogger("src/cache/UserCache.ts");

class UserCache {
    /**
     * Read the last time user changed his password in epoch SECONDS from cache.
     */
    readLastChangedPassword = async (req, res, next) => {
        try {
            if (req.headers && req.headers.authorization) {
                const payload = jsonWebToken.unsecuredPayload(req.headers.authorization);
                if ((await lastChangedPasswordDB.hasLastTimeChanged(payload.id)) === true) {
                    req.cache.read.last_changed_password = await lastChangedPasswordDB.getLastTimeChanged(payload.id);
                }
            }
        } catch (e) {
            log.error(e.message);
        }
        return next();
    }

    /**
     * Write the last time user changed his password in epoch SECONDS into cache.
     */
    writeLastChangedPassword = async (req, res, next) => {
        try {
            if (res.cache.write.last_changed_password) {
                await lastChangedPasswordDB.setLastTimeChanged(res.cache.write.last_changed_password.key, res.cache.write.last_changed_password.value);
            }
        } catch (e) {
            log.error(e.message);
        }
        return next();
    }
}

const userCache = new UserCache();
export default userCache;