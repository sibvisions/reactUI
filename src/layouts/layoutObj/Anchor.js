const { useDebugValue } = require("react");

class Anchor {
    constructor(pAnchorData, pRelatedAnchor, pPosition, pOrientation) {
        if(pRelatedAnchor === undefined && pPosition === undefined && pOrientation === undefined) {
            this.anchorData = pAnchorData;
        }
        else if(pAnchorData === undefined && pOrientation === undefined) {
            this.relatedAnchor = pRelatedAnchor;
            this.autoSize = false;
            this.position = pPosition;
            this.orientation = this.relatedAnchor.orientation;
        }
        else if(pAnchorData === undefined && pRelatedAnchor === undefined && pPosition === undefined) {
            this.orientation = pOrientation
        }
    }

    parseAnchorData() {
        if(this.anchorData !== undefined) {
            let splittedData = this.anchorData.split(',');
        }
    }
}