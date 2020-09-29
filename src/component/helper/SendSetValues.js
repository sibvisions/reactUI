export function sendSetValues(con, rowId, dataProvider, name, columnName, selectedColumn) {
    let value = selectedColumn;
    if (typeof selectedColumn === "object" && selectedColumn !== null) {
        value = Object.values(selectedColumn);
    }
    if (rowId) {
        if (con.contentStore.selectedRow.get(dataProvider) === rowId - 1) {
            con.serverComm.setValues(name, dataProvider, columnName, value)
        }
    }
    else {
        con.serverComm.setValues(name, dataProvider, columnName, value)
    }
}