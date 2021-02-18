/** Class for NullLayout Bounds */
class Bounds{
    /** Value for left positioning */
    left: number = 0;
    /** Value for top positioning */
    top: number = 0;
    /** Value for height of component */
    height: number = 0;
    /** Value for width of component */
    width: number = 0;

    /**
     * @constructor sets the boundsdata
     * @param boundsArray - the boundsdata
     */
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