import {ORIENTATION} from "./Anchor";

class Orientation{
    orientation?: string;

    constructor(orientationString?: string) {
        if(orientationString){
            this.setOrientation(orientationString);
        } else {
            this.orientation = ORIENTATION.HORIZONTAL
        }
    }

    setOrientation(orientation: string){
        if(orientation === "0"){
            this.orientation = ORIENTATION.HORIZONTAL;
        } else if(orientation === "1"){
            this.orientation = ORIENTATION.VERTICAL;
        }
    }
}
export default Orientation