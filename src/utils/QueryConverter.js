const queryConvert = (queryResult) => {
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

module.exports = queryConvert;