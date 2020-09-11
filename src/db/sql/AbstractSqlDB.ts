import orm from "../../utils/ORM";
import {uuid} from 'uuidv4';
import postgresDB from "../../drivers/PostgresDB";

export default abstract class AbstractSqlDB {
    private preparedStatements = new Map<String, String>();

    query = async (sqlQuery: string, queryValues: Array<any>) => {
        let queryName;
        if (this.preparedStatements.has(sqlQuery)) {
            queryName = this.preparedStatements.get(sqlQuery);
        } else {
            queryName = uuid();
            this.preparedStatements.set(sqlQuery, queryName);
        }
        const preparedStatement = {
            name: queryName,
            rowMode: "array",
            text: sqlQuery,
            values: queryValues
        };
        return orm((postgresDB.query(preparedStatement)));
    }
}