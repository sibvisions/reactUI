/** Class for the amount of rows and columns in a GridLayout */
class GridSize{
    /** rows of a grid */
    rows: number
    /** columns of a grid */
    columns: number

    /**
     * @constructor - constructs new gridsize based on the given gridString
     * @param gridString - the data to define the GridSize
     */
    constructor(gridString: Array<string>) {
        this.rows = parseInt(gridString[0]);
        this.columns  = parseInt(gridString[1]);
    }
}
export default GridSize