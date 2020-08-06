export class Alignments {

    hAlignment;
    vAlignment;
    cAlignment;

    constructor(alignmentArray, layoutType) {
        this.setHAlignment(alignmentArray[0], layoutType);
        this.setVAlignment(alignmentArray[1], layoutType);
        this.setCAlignment(alignmentArray[2], layoutType);
        // this.setAlignments(alignmentArray, layoutType)
    }

    getHAlignment() {
        return this.hAlignment;
    }

    getVAlignment() {
        return this.vAlignment
    }

    getCAlignment() {
        return this.cAlignment
    }

    setHAlignment(alignment, layoutType) {
        if (alignment === '1') {
            this.hAlignment = 'center';
        }
        else if (alignment === '3') {
            this.hAlignment = 'stretch';
        }
        else if (alignment === '0') {
            if (layoutType === 'flow') {
                this.hAlignment = 'flex-start';
            }
            else if (layoutType === 'form') {
                this.hAlignment = 'left';
            }
        }
        else if (alignment === '2') {
            if (layoutType === 'flow') {
                this.hAlignment = 'flex-end';
            }
            else if (layoutType === 'form') {
                this.hAlignment = 'right';
            }
        }
    }

    setVAlignment(alignment, layoutType) {
        if (alignment === '1') {
            this.vAlignment = 'center';
        }
        else if (alignment === '3') {
            this.vAlignment = 'stretch';
        }
        else if (alignment === '0') {
            if (layoutType === 'flow') {
                this.vAlignment = 'flex-start';
            }
            else if (layoutType === 'form') {
                this.vAlignment = 'top';
            }
        }
        else if (alignment === '2') {
            if (layoutType === 'flow') {
                this.vAlignment = 'flex-end';
            }
            else if (layoutType === 'form') {
                this.vAlignment = 'bottom';
            }
        }
    }

    setCAlignment(alignment) {
        if (alignment === '1') {
            this.cAlignment = 'center';
        }
        else if (alignment === '3') {
            this.cAlignment = 'stretch';
        }
        else if (alignment === '0') {
                this.cAlignment = 'flex-start';
        }
        else if (alignment === '2') {
                this.cAlignment = 'flex-end';
        }
    }

    // setAlignments(alignments, layoutType) {
    //     let field;
    //     for(var i = 0; i < alignments.length; i++) {
    //         if (alignments[i] === '0') {
    //             if (layoutType === 'flow') {
    //                 field = 'flex-start';
    //             }
    //             else if (layoutType === 'form') {
    //                 if (i === 0) {
    //                     field = 'left';
    //                 }
    //                 else if(i === 1) {
    //                     field = 'top';
    //                 }
    //             }
    //         }
    //         else if (alignments[i] === '1') {
    //             field = 'center';
    //         }
    //         else if (alignments[i] === '2') {
    //             if (layoutType === 'flow') {
    //                 field = 'flex-end'
    //             }
    //             else if (layoutType === 'form') {
    //                 if (i === 0) {
    //                     field = 'right'
    //                 }
    //                 else if (i === 1) {
    //                     field = 'bottom'
    //                 }
    //             }
    //         }
    //         else if (alignments[i] === '3') {
    //             field = 'stretch';
    //         }
    //         if (i === 0) {
    //             this.hAlignment = field
    //         }
    //         else if (i === 1) {
    //             this.vAlignment = field
    //         }
    //         else {
    //             this.cAlignment = field
    //         }
    //     }
    // }
}