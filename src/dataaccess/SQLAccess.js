const Pool = require('pg').Pool;
const log = require('../log/Logger');

/**
 * manages access to postgres database
 */
class SQLAccess {

    constructor() {
        this.pool = new Pool({
            user: process.env.POSTGRES_USER,
            host: process.env.POSTGRES_HOST,
            database: process.env.POSTGRES_DB,
            password: process.env.POSTGRES_PASSWORD,
            port: 5432
        });
        log.debug("Using SQL's pool with following information:", this.pool.options.host, this.pool.options.database, this.pool.options.user);
    }

    // initialize db by running scripts for table, index creation
    initialize(data){
        log.debug('Database initialization: use given data from scripts in query');
        this.pool.query(data);
    }

    // Used for transactions
    begin() {
        log.debug('Transaction: Begin');
        return this.pool.query('BEGIN');

    }
    commit() {
        log.debug('Transaction successfully ended: Commit');
        return this.pool.query('COMMIT');

    }
    rollback() {
        log.debug('Transaction failed: Rollback')
        return this.pool.query('ROLLBACK');

    }
}

const sqlAccess = new SQLAccess();
module.exports = sqlAccess;