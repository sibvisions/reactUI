import Margins from "./Margins";

class CellConstraints{
    gridX: number
    gridY: number
    gridWidth: number
    gridHeight: number
    margins: Margins
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