class GridSize{
    rows: string
    columns: string

    constructor(gridString: Array<string>) {
        this.rows = gridString[0];
        this.columns  = gridString[1]
    }
}
export default GridSize