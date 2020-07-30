export class Alignments {

    hAlignment;
    vAlignment;
    cAlignment;

    constructor(alignmentString, layoutType) {
        this.setAlignments(alignmentString, layoutType)
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

    setAlignments(alignments, layoutType) {
        let field;
        for(var i = 0; i < alignments.length; i++) {
            if (alignments[i] === '0') {
                if (layoutType === 'flow') {
                    field = 'flex-start';
                }
                else if (layoutType === 'form') {
                    if (i === 0) {
                        field = 'left';
                    }
                    else if(i === 1) {
                        field = 'top';
                    }
                }
            }
            else if (alignments[i] === '1') {
                field = 'center';
            }
            else if (alignments[i] === '2') {
                if (layoutType === 'flow') {
                    field = 'flex-end'
                }
                else if (layoutType === 'form') {
                    if (i === 0) {
                        field = 'right'
                    }
                    else if (i === 1) {
                        field = 'bottom'
                    }
                }
            }
            else if (alignments[i] === '3') {
                field = 'stretch';
            }
            if (i === 0) {
                this.hAlignment = field
            }
            else if (i === 1) {
                this.vAlignment = field
            }
            else {
                this.cAlignment = field
            }
        }
    }
}