import lastChangedPasswordDB from "../db/redis/LastChangedPasswordDB";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";

const log = loggerFactory.buildDebugLogger("src/cache/UserCache.ts");

class UserCache {
    /**
     * Read the last time user changed his password in epoch SECONDS from cache.
     *
     * This handler will be called for each request.
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
     *
     * This handler will only be called if the SQL layer wants to (in case the cache must be invalidated).
     * In this case, the SQL layer handler call next() and set the status, body of the response
     * in res.cache.response.* as well as set the intended cache to invalidate at res.cache.write.*
     *
     * The response handling will be dealed by Cacheable.finalize
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