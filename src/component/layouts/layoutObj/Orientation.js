export class Orientation {

    orientation;

    constructor(orientationString) {
        if (orientationString !== undefined) {
            this.setOrientation(orientationString[0])
        }
        else {
            this.orientation = 'horizontal'
        }
    }

    getOrientation() {
        return this.orientation;
    }

    setOrientation(orientation) {
        if (orientation === '0' || orientation === 'horizontal') {
            this.orientation = 'horizontal'
        } 
        else if (orientation === '1' || orientation === 'vertical') {
            this.orientation = 'vertical'
        }
    }
}