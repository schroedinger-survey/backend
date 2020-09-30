import loggerFactory from "../utils/Logger";
import Context from "../utils/Context";
const Pool = require("pg").Pool;

const log = loggerFactory.buildDebugLogger("src/drivers/PostgresDB.js");


class PostgresDB {
    private pool;

    constructor() {
        Context.setMethod("constructor");
        log.info(`PostgreSQL connection: ${process.env.POSTGRES_HOST} ${process.env.POSTGRES_USER} ${process.env.POSTGRES_DB}`)
        this.createPool();
    }

    createPool = () => {
        if(!this.pool || this.pool.ended) {
            this.pool = new Pool({
                user: process.env.POSTGRES_USER,
                host: process.env.POSTGRES_HOST,
                database: process.env.POSTGRES_DB,
                password: process.env.POSTGRES_PASSWORD,
                port: 5432,
                max: 50,
                idleTimeoutMillis: 60 * 60 * 1000,
                connectionTimeoutMillis: 5000
            });
        }
    }

    close = ()=> {
        if(!this.pool.ended) {
            return this.pool.end();
        }
    }

    query = (data) => {
        return this.pool.query(data);
    }

    begin = (isolationLevel = "READ COMMITTED") => {
        return this.pool.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    }

    savepoint = (name) => {
        return this.pool.query(`SAVEPOINT ${name}`);
    }

    commit = () => {
        return this.pool.query("COMMIT");

    }

    rollback = () => {
        return this.pool.query("ROLLBACK");

    }
}

const postgresDB = new PostgresDB();
export default postgresDB;