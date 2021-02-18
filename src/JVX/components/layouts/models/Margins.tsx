/** Class for margins of layouts or components */
class Margins{
    /** The top margin */
    marginTop = 0;
    /** The left margin */
    marginLeft = 0;
    /** The bottom margin */
    marginBottom = 0;
    /** The right margin */
    marginRight = 0;

    /**
     * @constructor - constructs new margins based on the given marginArray
     * @param marginsArray - the data used for the Margins
     */
    constructor(marginsArray?: Array<string>){
        if(marginsArray){
            this.marginTop = parseInt(marginsArray[0]);
            this.marginLeft = parseInt(marginsArray[1]);
            this.marginBottom = parseInt(marginsArray[2]);
            this.marginRight = parseInt(marginsArray[3]);
        }
    }
}
export default Margins