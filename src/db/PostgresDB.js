const Pool = require("pg").Pool;
const log = require("../utils/Logger");

class PostgresDB {
    constructor() {
        log.debug(`Database connection information ${process.env.POSTGRES_HOST} ${process.env.POSTGRES_USER} ${process.env.POSTGRES_DB}`)
        this.createPool();
    }

    createPool() {
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

    close() {
        if(!this.pool.ended) {
            return this.pool.end();
        }
    }

    clearDatabase(){
        return this.query("DELETE FROM users WHERE id IS NOT NULL");
    }

    query(data) {
        if (this.pool.ended) {
            this.createPool();
        }
        return this.pool.query(data);
    }

    begin() {
        if (this.pool.ended) {
            this.createPool();
        }
        return this.pool.query("BEGIN");

    }

    commit() {
        if (this.pool.ended) {
            this.createPool();
        }
        return this.pool.query("COMMIT");

    }

    rollback() {
        if (this.pool.ended) {
            this.createPool();
        }
        return this.pool.query("ROLLBACK");

    }
}

const postgresDB = new PostgresDB();
module.exports = postgresDB;