import redisDB from "../../drivers/RedisDB";

const TTL = Number(process.env.TTL) * 1000;

class BlackListedJwtDB {
    add = (token) => {
        return redisDB.setex(token, TTL, "BLACK_LISTED");
    }

    isBlackListed = async (token) => {
        return (await redisDB.exists(token)) === 1;
    }
}

const blackListedJwtDB = new BlackListedJwtDB();
export default blackListedJwtDB;