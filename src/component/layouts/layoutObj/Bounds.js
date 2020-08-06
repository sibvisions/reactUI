export class Bounds {

    left;
    top;
    height;
    width;

    constructor(boundsArray) {
        if (boundsArray !== undefined) {
            this.setLeft(boundsArray[0]);
            this.setTop(boundsArray[1]);
            this.setHeight(boundsArray[2]);
            this.setWidth(boundsArray[3]);
        }
        else {
            console.log("Bounds was not given the right arguments")
        }
    }

    getLeft() {
        return this.left
    }

    getTop() {
        return this.top;
    }

    getHeight() {
        return this.height;
    }

    getWidth() {
        return this.width;
    }

    setLeft(left) {
        this.left = parseInt(left);
    }

    setTop(top) {
        this.top = parseInt(top);
    }

    setHeight(height) {
        this.height = parseInt(height);
    }

    setWidth(width) {
        this.width = parseInt(width)
    }
}