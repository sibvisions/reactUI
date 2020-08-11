import { Orientation } from "./Orientation";

export class Anchor {

    name;
    anchorData;
    relatedAnchor;
    autoSize;
    autoSizeCalculated;
    firstCalculation;
    relative;
    position;
    orientation;
    layout;

    constructor(pAnchorData, pRelatedAnchor, pPosition, pOrientation, pLayout) {
        if(pAnchorData !== undefined && pRelatedAnchor === undefined && pPosition === undefined 
            && pOrientation === undefined) {
            this.setAnchorData(pAnchorData)
        }
        else if(pAnchorData === undefined && pRelatedAnchor !== undefined && pPosition !== undefined && pOrientation === undefined) {
            this.relatedAnchor = pRelatedAnchor;
            this.autoSize = false;
            this.position = pPosition;
            this.orientation = this.relatedAnchor.orientation;
        }
        else if(pAnchorData === undefined && pRelatedAnchor === undefined && pPosition === undefined && pOrientation !== undefined) {
            this.orientation = new Orientation(pOrientation);
            this.relatedAnchor = null;
            this.autoSize = false;
            this.position = 0
        }
        else {
            console.log("Anchor was not given the right arguments")
        }
        if(pLayout !== undefined) {
            this.layout = pLayout
        }
    }

    setAnchorData(pAnchorData) {
        this.anchorData = pAnchorData;
    }

    parseAnchorData() {
        if(this.anchorData !== undefined) {
            let splittedData = this.anchorData.split(',');
            this.name = splittedData[0];
            let relatedAnchorName = splittedData[1];
            if(relatedAnchorName !== '-') {
                this.relatedAnchor = this.layout.anchors.get(relatedAnchorName)
            }
            else {
                this.relatedAnchor = null
            }
            if(splittedData[3] === 'a') {
                this.autoSize = true
            }
            else {
                this.autoSize = false
            }
            this.position = parseInt(splittedData[4])
        }
    }

    getAbsolutePosition() {
        if(this.relatedAnchor === null) {
            return this.position;
        }
        else {
            return this.relatedAnchor.getAbsolutePosition() + this.position;
        }
    }

    getBorderAnchor() {
        var borderAnchor = this;
        while(borderAnchor.relatedAnchor !== null) {
            borderAnchor = borderAnchor.relatedAnchor
        }
        return borderAnchor;
    }

    getRelativeAnchor() {
        var relativeAnchor = this;
        while(relativeAnchor !== null && !relativeAnchor.relative) {
            relativeAnchor = relativeAnchor.relatedAnchor;
        }
        return relativeAnchor;
    }
}