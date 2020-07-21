export class Margins {

    marginTop;
    marginLeft;
    marginBottom;
    marginRight;

    constructor(marginsArray) {
        if (marginsArray !== undefined) {
            this.setMarginTop(marginsArray[0]);
            this.setMarginLeft(marginsArray[1]);
            this.setMarginBottom(marginsArray[2]);
            this.setMarginRight(marginsArray[3]);
        }
        else {
            this.setMarginTop(0);
            this.setMarginLeft(0);
            this.setMarginBottom(0);
            this.setMarginRight(0);
        }
    }

    getMarginTop() {
        return this.marginTop;
    }

    getMarginLeft() {
        return this.marginLeft;
    }

    getMarginBottom() {
        return this.marginBottom;
    }

    getMarginRight() {
        return this.marginRight;
    }

    setMarginTop(marginTop) {
        this.marginTop = marginTop;
    }

    setMarginLeft(marginLeft) {
        this.marginLeft = marginLeft;
    }

    setMarginBottom(marginBottom) {
        this.marginBottom = marginBottom;
    }

    setMarginRight(marginRight) {
        this.marginRight = marginRight;
    }
}