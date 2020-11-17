export enum ORIENTATION {
    HORIZONTAL= 0,
    VERTICAL= 1
}

class Anchor{
    name: string;
    anchorData: string;
    relatedAnchor?: Anchor
    relatedAnchorName: string
    autoSize: boolean;
    autoSizeCalculated: boolean;
    firstCalculation: boolean;
    relative: boolean;
    position: number;
    orientation: number;

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
    }

    getOrientationFromData(anchorName: string){
        if(anchorName.startsWith("l") && anchorName.startsWith("r")){
            return ORIENTATION.HORIZONTAL;
        } else {
            return ORIENTATION.VERTICAL;
        }
    }

    getAbsolutePosition = (): number => {
        if(this.relatedAnchor){
            return this.relatedAnchor.getAbsolutePosition() + this.position;
        } else {
            return this.position;
        }
    }

    getBorderAnchor = (): Anchor => {
        let borderAnchor: Anchor = this;
        while (borderAnchor.relatedAnchor){
            borderAnchor = borderAnchor.relatedAnchor
        }
        return borderAnchor
    }

    getRelativeAnchor = (): Anchor => {
        let start: Anchor = this;
        while(start && !start.relative && start.relatedAnchor){
            start = start.relatedAnchor;
        }
        return start
    }
}
export default Anchor