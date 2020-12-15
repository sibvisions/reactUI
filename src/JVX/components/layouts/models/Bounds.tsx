class Bounds{
    left: number = 0;
    top: number = 0;
    height: number = 0;
    width: number = 0;

    constructor(boundsArray: string[]){
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