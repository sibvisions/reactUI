class TreePath {
    array:number[];

    constructor(...path:number[]) {
        this.array = path;
    }

    toString() {
        return JSON.stringify(this.array);
    }

    length() {
        return this.array.length;
    }
}
export default TreePath