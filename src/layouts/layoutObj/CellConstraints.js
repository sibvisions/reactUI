import { Margins } from "./Margins";

export class CellConstraints {

    gridX;
    gridY;
    gridWidth;
    gridHeight;
    margins;

    constructor(cellConstraintsString) {
        let cellNoMargins = cellConstraintsString.substring(0, cellConstraintsString.indexOf(',')-2).split(';');
        let extractedMargins = cellConstraintsString.substring(cellConstraintsString.indexOf(',')-1, cellConstraintsString.length).split(',');
        this.setGridX(cellNoMargins[0]);
        this.setGridY(cellNoMargins[1]);
        this.setGridWidth(cellNoMargins[2]);
        this.setGridHeight(cellNoMargins[3]);
        this.margins = new Margins(extractedMargins)
    }

    getGridX() {
        return this.gridX;
    }

    getGridY() {
        return this.gridY;
    }

    getGridWidth() {
        return this.gridWidth;
    }

    getGridHeight() {
        return this.gridHeight;
    }

    setGridX(pGridX) {
        this.gridX = pGridX;
    }

    setGridY(pGridY) {
        this.gridY = pGridY;
    }

    setGridWidth(pGridWidth) {
        this.gridWidth = pGridWidth;
    }

    setGridHeight(pGridHeight) {
        this.gridHeight = pGridHeight
    }
}