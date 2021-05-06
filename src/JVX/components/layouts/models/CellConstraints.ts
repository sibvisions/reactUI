/** Other imports */
import { Margins } from "../";

/** Class for the CellConstraints of GridLayout */
class CellConstraints{
    /** The position on the x-axis */
    gridX: number
    /** The position on the y-axis */
    gridY: number
    /** The width of the component in grids */
    gridWidth: number
    /** The height of the component in grids */
    gridHeight: number
    /** The margins of the component */
    margins: Margins

    /**
     * @constructor extracts the values from the cellConstraintsString and sets the values
     * @param cellConstraintsString - the cellConstraintsString where the values get extracted from
     */
    constructor(cellConstraintsString: string) {
        let cellNoMargins = cellConstraintsString.substring(0, cellConstraintsString.indexOf(',')-2).split(';');
        let extractedMargins = cellConstraintsString.substring(cellConstraintsString.indexOf(',')-1, cellConstraintsString.length).split(',');
        this.gridX = parseInt(cellNoMargins[0]);
        this.gridY = parseInt(cellNoMargins[1]);
        this.gridWidth = parseInt(cellNoMargins[2]);
        this.gridHeight = parseInt(cellNoMargins[3]);
        this.margins = new Margins(extractedMargins);
    }
}
export default CellConstraints