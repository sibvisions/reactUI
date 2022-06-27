/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import Margins from "./Margins"

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