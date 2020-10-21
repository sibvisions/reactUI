export class UIFont {
    fontFamily = "";
    fontWeight = "normal";
    fontStyle = "normal";
    fontSize = 16;

    constructor(fontArray?:Array<string>) {
        if (fontArray) {
            this.setFontFamily(fontArray[0]);
            this.setFontWeight(fontArray[1]);
            this.setFontStyle(fontArray[1]);
            this.setFontSize(fontArray[2]);
        }
    }

    setFontFamily(fontFamily:string) {
        this.fontFamily = fontFamily;
    }

    setFontWeight(fontWeight:string) {
        if (fontWeight === '1' || fontWeight === '3') {
            this.fontWeight = 'bold';
        }
    }

    setFontStyle(fontStyle:string) {
        if (fontStyle === '2' || fontStyle === '3') {
            this.fontStyle = 'italic';
        }
    }

    setFontSize(fontSize:string) {
        if (fontSize !== null) {
            this.fontSize = parseInt(fontSize);
        }
    }
}