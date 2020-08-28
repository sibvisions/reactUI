export class GridSize {

    rows;
    columns;

    constructor(gridString) {
        if(gridString !== undefined) {
            this.setRows(gridString[0]);
            this.setColumns(gridString[1]);
        }
        else {
             
        }
    }

    getRows() {
        return this.rows
    }

    getColumns() {
        return this.columns
    }

    setRows(rows) {
        this.rows = rows
    }

    setColumns(columns) {
        this.columns = columns
    }
}