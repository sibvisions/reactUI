class Bounds{
    left?: number;
    top?: number;
    height?: number;
    width?: number;

    constructor(boundsArray?: Array<string>){
        if(boundsArray){
            this.left = parseInt(boundsArray[0]);
            this.top = parseInt(boundsArray[1]);
            this.height = parseInt(boundsArray[2]);
            this.width = parseInt(boundsArray[3]);
        } else {
            console.warn("Bounds was not given the right arguments")
        }
    }
}
export default Bounds