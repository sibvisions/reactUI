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

/** Enum for orientation */
export enum ORIENTATION {
    HORIZONTAL= 0,
    VERTICAL= 1
}

/** Class for FormLayout anchors */
class Anchor{
    /** Name of anchor */
    name: string;
    /** String of anchor, data gets extracted from it*/
    anchorData: string;
    /** The related anchor to the current anchor */
    relatedAnchor?: Anchor
    /** The name of the related anchor to the current anchor */
    relatedAnchorName: string
    /** true, if this anchor should be auto sized. */
    autoSize: boolean;
    /** If autosize has already been calculated */
    autoSizeCalculated: boolean;
    /** True, if the relative anchor is not calculated. **/
    firstCalculation: boolean;
    /** True, if the anchor is not calculated by components preferred size. **/
    relative: boolean;
    /** The position of this anchor. */
    position: number;
    /** The orientation of this anchor. */
    orientation: number;
    /** True, if the anchor is used by a visible component. **/
    used: boolean

    /**
     * @constructor extracts and sets anchordata and default values
     * @param anchorData - the anchordata where the values get extracted from
     */
    constructor(anchorData : string) {
        const splitData  = anchorData.split(",");
        this.anchorData = anchorData;
        this.name = splitData[0];
        this.relatedAnchorName = splitData[1];
        this.autoSize = splitData[3] === "a";

        this.autoSizeCalculated = false;
        this.firstCalculation = true;
        this.relative = false;
        this.position = parseInt(splitData[4]);
        this.orientation = this.getOrientationFromData(splitData[0]);
        this.used = false;
    }

    /**
     * Returns wether the orientation of the anchor is horizontal or vertical
     * @param anchorName - name of the anchor
     */
    getOrientationFromData(anchorName: string){
        if(anchorName.startsWith("l") || anchorName.startsWith("r")){
            return ORIENTATION.HORIZONTAL;
        } else {
            return ORIENTATION.VERTICAL;
        }
    }

    /**
	* Returns the absolute position of this Anchor in this FormLayout.
	* The position is only correct if the layout is valid.
	* @returns the absolute position.
	*/
    getAbsolutePosition = (): number => {
        if(this.relatedAnchor){
            return this.relatedAnchor.getAbsolutePosition() + this.position;
        } else {
            return this.position;
        }
    }

    /**
	* Gets the related border anchor to this anchor.
	* @return the related border anchor.
    */
    getBorderAnchor = (): Anchor => {
        let borderAnchor: Anchor = this;
        while (borderAnchor.relatedAnchor){
            borderAnchor = borderAnchor.relatedAnchor
        }
        return borderAnchor
    }

    /**
	* Gets the related unused auto size anchor.
	* @return the related unused auto size anchor.
	*/
    getRelativeAnchor = (): Anchor => {
        let start: Anchor = this;
        while(start && !start.relative && start.relatedAnchor){
            start = start.relatedAnchor;
        }
        return start
    }
}
export default Anchor