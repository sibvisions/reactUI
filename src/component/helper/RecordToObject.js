export function recordToObject(response, record) {
    let mergedRecord = {};
        for (let i = 0; i < response.columnNames.length; i++) {
            mergedRecord[response.columnNames[i]] = record[i];
        }
        return mergedRecord;
}