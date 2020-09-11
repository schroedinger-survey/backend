/**
 * Convert the result of Node-PG's query into a JSON-Array
 *
 * For this method to work out, the query must be in row-array mode.
 *
 * @param queryResult return value of Node-PG's query
 * @returns {[]} JSON-Array
 *
 * More about rowMode array at https://node-postgres.com/features/queries
 */
const orm = (queryResult) => {
    const result = [];
    for (let i = 0; i < queryResult.rows.length; i++) {
        const obj = {};
        for (let j = 0; j < queryResult.fields.length; j++) {
            obj[queryResult.fields[j].name] = queryResult.rows[i][j];
        }
        result.push(obj);
    }
    return result;
}

export default orm;