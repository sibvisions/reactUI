class Gaps{
    horizontalGap = 0;
    vertical = 0;

    constructor(gapsArray? : Array<string>) {
        if(gapsArray){
            this.horizontalGap = parseInt(gapsArray[0]);
            this.vertical = parseInt(gapsArray[1]);
        }
    }
}
export default Gaps