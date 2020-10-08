export function sendSetValues(con, rowId, dataProvider, name, columnName, selectedColumn) {
    let value = selectedColumn;
    if (typeof selectedColumn === "object" && selectedColumn !== null) {
        value = Object.values(selectedColumn);
    }
        con.serverComm.setValues(name, dataProvider, columnName, value)
}