export class Gaps {

    horizontalGap;
    verticalGap;

    constructor(gapsArray) {
        if (gapsArray !== undefined) {
            this.setHorizontalGap(parseInt(gapsArray[0]));
            this.setVerticalGap(parseInt(gapsArray[1]));
        }
        else {
            this.setHorizontalGap(0);
            this.setVerticalGap(0);
        }
    }

    getHorizontalGap() {
        return this.horizontalGap;
    }

    getVerticalGap() {
        return this.verticalGap;
    }

    setHorizontalGap(horizontalGap) {
        this.horizontalGap = horizontalGap
    }

    setVerticalGap(verticalGap) {
        this.verticalGap = verticalGap
    }
}