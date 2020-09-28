import redisDB from "../../drivers/RedisDB";

const TTL = Number(process.env.TTL) * 1000;

class BlackListedJwtDB {
    blacklist = (jwtToken: string) => {
        return redisDB.setex(jwtToken, TTL, "BLACK_LISTED");
    }

    isBlacklisted = async (jwtToken: string) => {
        return (await redisDB.exists(jwtToken)) === 1;
    }
}

const blackListedJwtDB = new BlackListedJwtDB();
export default blackListedJwtDB;