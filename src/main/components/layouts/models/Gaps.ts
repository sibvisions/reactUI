/** Class for Gaps between components in layouts */
class Gaps{
    /** The vertical gap of a layout */
    verticalGap = 0;
    /** The horizontal gap of a layout */
    horizontalGap = 0;

    /**
     * @constructor - constructs new gaps based on the given data
     * @param gapsArray - the data used to define gaps
     */
    constructor(gapsArray? : Array<string>) {
        if(gapsArray){
            this.verticalGap = parseInt(gapsArray[1]);
            this.horizontalGap = parseInt(gapsArray[0]);
        }
    }
}
export default Gaps