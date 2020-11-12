class Gaps{
    verticalGap = 0;
    horizontalGap = 0;

    constructor(gapsArray? : Array<string>) {
        if(gapsArray){
            this.verticalGap = parseInt(gapsArray[0]);
            this.horizontalGap = parseInt(gapsArray[1]);
        }
    }
}
export default Gaps