import Margins from "./Margins";

class CellConstraints{
    gridX: string
    gridY: string
    gridWidth: string
    gridHeight: string
    margins: Margins
    constructor(cellConstraintsString: string) {
        let cellNoMargins = cellConstraintsString.substring(0, cellConstraintsString.indexOf(',')-2).split(';');
        let extractedMargins = cellConstraintsString.substring(cellConstraintsString.indexOf(',')-1, cellConstraintsString.length).split(',');
        this.gridX = cellNoMargins[0];
        this.gridY = cellNoMargins[1];
        this.gridWidth = cellNoMargins[2];
        this.gridHeight = cellNoMargins[3];
        this.margins = new Margins(extractedMargins);
    }
}
export default CellConstraints