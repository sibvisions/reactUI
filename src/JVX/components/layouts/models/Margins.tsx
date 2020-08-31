class Margins{
    marginTop = 0;
    marginLeft = 0;
    marginBottom = 0;
    marginRight = 0;
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