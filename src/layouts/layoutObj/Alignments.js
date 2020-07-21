export class Alignments {

    hAlignment;
    vAlignment;
    cAlignment;

    constructor(alignmentString) {
        this.setAlignments(alignmentString)
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

    setAlignments(alignments) {
        let field;

        for(var i = 0; i < alignments.length; i++) {
            if (alignments[i] === '0') {
                field = 'flex-start';
            }
            else if (alignments[i] === '1') {
                field = 'center';
            }
            else if (alignments[i] === '2') {
                field = 'flex-end'
            }
            else if (alignments[i] === '3') {
                field = 'stretch';
            }
            else {
                field = 'flex-start';
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