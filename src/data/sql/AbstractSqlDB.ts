import orm from "../../utils/ORM";
import {v4 as uuid} from "uuid";
import postgresDB from "../drivers/PostgresDB";

export default abstract class AbstractSqlDB {
    private preparedStatements = new Map<string, string>();

    query = async (sqlQuery: string, queryValues: Array<unknown>): Promise<Array<Record<string, any>>> => {
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
        return orm((await postgresDB.query(preparedStatement)));
    }
}