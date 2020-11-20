class GridSize{
    rows: number
    columns: number

    constructor(gridString: Array<string>) {
        this.rows = parseInt(gridString[0]);
        this.columns  = parseInt(gridString[1]);
    }
}
export default GridSize