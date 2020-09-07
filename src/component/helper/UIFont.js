export class UIFont {

    fontFamily;
    fontWeight;
    fontStyle;
    fontSize;

    constructor(fontArray) {
        this.setFontFamily(fontArray[0]);
        this.setFontWeight(fontArray[1]);
        this.setFontStyle(fontArray[1]);
        this.setFontSize(fontArray[2]);
    }

    getFontFamily() {
        return this.fontFamily;
    }

    getFontWeight() {
        return this.fontWeight
    }

    getFontStyle() {
        return this.fontStyle;
    }

    getFontSize() {
        return this.fontSize;
    }

    setFontFamily(fontFamily) {
        this.fontFamily = fontFamily;
    }

    setFontWeight(fontWeight) {
        if (fontWeight === '0' || fontWeight === '2') {
            this.fontWeight = 'normal';
        }
        else if (fontWeight === '1' || fontWeight === '3') {
            this.fontWeight = 'bold';
        }
    }

    setFontStyle(fontStyle) {
        if (fontStyle === '0' || fontStyle === '1') {
            this.fontStyle = 'normal';
        }
        else if (fontStyle === '2' || fontStyle === '3') {
            this.fontStyle = 'italic';
        }
    }

    setFontSize(fontSize) {
        if (fontSize !== null) {
            this.fontSize = parseInt(fontSize);
        }
        else {
            this.fontSize = 16
        }
    }
}