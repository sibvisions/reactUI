export class Size {
    width = 0;
    height = 0;

    constructor(pWidth, pHeight, pData) {
        if(pWidth === undefined && pHeight === undefined && pData === undefined) {
            this.width = 0;
            this.height = 0;
        }
        else if(pWidth !== undefined && pHeight !== undefined && pData === undefined) {
            this.width = pWidth;
            this.height = pHeight;
        }
        else if(pWidth === undefined && pHeight === undefined && pData !== undefined) {
            this.width = 0;
            this.height = 0;
            this.set(pData); 
        }
    }

    getWidth() {
        return this.width
    }

    getHeight() {
        return this.height;
    }

    set(pData) {
        if(pData !== undefined && pData.length > 0 && pData.includes(",")) {
            let splittedData = pData.split(",");
            this.width = parseInt(splittedData[0]);
            this.height = parseInt(splittedData[1]);
        }
        else {
            this.width = 0;
            this.height = 0;
        }
    }

    setWidth(pWidth) {
        this.width = pWidth;
    }

    setHeight(pHeight) {
        this.height = pHeight;
    }
}