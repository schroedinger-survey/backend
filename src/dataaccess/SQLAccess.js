const Pool = require("pg").Pool;

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
        }
    }

    close() {
        if(!this.pool.ended) {
            return this.pool.end();
        }
    }

    clearDatabase(){
        return this.query("DELETE FROM users");
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

const sqlAccess = new SQLAccess();
module.exports = sqlAccess;