const Pool = require("pg").Pool;

const log = require("../log/Logger");

class SQLAccess {
    constructor() {
        this.createPool();
    }

    createPool() {
        if(!this.pool || this.pool.ended) {
            this.pool = new Pool({
                user: process.env.POSTGRES_USER,
                host: process.env.POSTGRES_HOST,
                database: process.env.POSTGRES_DB,
                password: process.env.POSTGRES_PASSWORD,
                port: 5432
            });
            log.debug("Using SQL's pool with following information:", this.pool.options.host, this.pool.options.database, this.pool.options.user);
        }
    }

    close() {
        if(!this.pool.ended) {
            return this.pool.end();
        }
    }

    // Initialize db by running scripts for table, index creation
    query(data) {
        if (this.pool.ended) {
            this.createPool();
        }
        return this.pool.query(data);
    }

    // Used for transactions
    begin() {
        if (this.pool.ended) {
            this.createPool();
        }
        log.debug("Transaction: Begin");
        return this.pool.query("BEGIN");

    }

    commit() {
        if (this.pool.ended) {
            this.createPool();
        }
        log.debug("Transaction successfully ended: Commit");
        return this.pool.query("COMMIT");

    }

    rollback() {
        if (this.pool.ended) {
            this.createPool();
        }
        log.debug("Transaction failed: Rollback")
        return this.pool.query("ROLLBACK");

    }
}

const sqlAccess = new SQLAccess();
module.exports = sqlAccess;