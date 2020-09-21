export function sendSetValues(con, rowId, dataProvider, name, columnName, selectedColumn) {
    if (rowId) {
        if (con.contentStore.selectedRow.get(dataProvider) === rowId - 1) {
            con.serverComm.setValues(name, dataProvider, columnName, selectedColumn)
        }
    }
    else {
        con.serverComm.setValues(name, dataProvider, columnName, selectedColumn)
    }
}