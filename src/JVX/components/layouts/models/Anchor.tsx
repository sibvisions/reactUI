export enum ORIENTATION {
    HORIZONTAL= "horizontal",
    VERTICAL= "vertical"

}

type anchorInterface = {
    name?: string,
    anchorData?: string,
    relatedAnchor?: Anchor,
    autoSize?: boolean;
    autoSizeCalculated?: boolean,
    firstCalculation?: boolean,
    relative?: boolean,
    position?: number,
    orientation?: string

}

class Anchor{
    name = "";
    anchorData = "";
    relatedAnchor?: Anchor
    autoSize = false;
    autoSizeCalculated = false;
    firstCalculation = false;
    relative = false;
    position = 0;
    orientation = "";

    constructor(values: anchorInterface) {
        if(values.anchorData && !values.relatedAnchor && !values.position && !values.orientation){
            this.anchorData = values.anchorData
        } else if(!values.anchorData && values.relatedAnchor && values.position && !values.orientation){
            this.relatedAnchor = values.relatedAnchor;
            this.autoSize = false;
            this.position = values.position;
            this.orientation = this.relatedAnchor.orientation;
        } else if(!values.anchorData && !values.relatedAnchor && !values.position && values.orientation){
            this.orientation = values.orientation;
            this.autoSize = false;
            this.position = 0
        }
        else {
            console.warn("Anchor was not given the right arguments");
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