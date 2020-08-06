export class Constraints {
    topAnchor
    leftAnchor
    bottomAnchor
    rightAnchor

    constructor(pLayout, pConstraintData, pTopAnchor, pLeftAnchor, pBottomAnchor, pRightAnchor) {
        if (pLayout !== undefined && pConstraintData !== undefined && pTopAnchor === undefined
            && pLeftAnchor === undefined && pBottomAnchor === undefined && pRightAnchor === undefined) {
            let constraintData = pConstraintData.split(';')
            this.setTopAnchor(pLayout.anchors.get(constraintData[0]));
            this.setLeftAnchor(pLayout.anchors.get(constraintData[1]));
            this.setBottomAnchor(pLayout.anchors.get(constraintData[2]));
            this.setRightAnchor(pLayout.anchors.get(constraintData[3]))
        }
        else if (pLayout === undefined && pConstraintData === undefined && pTopAnchor !== undefined
            && pLeftAnchor !== undefined && pBottomAnchor !== undefined && pRightAnchor !== undefined) {
            this.setTopAnchor(pTopAnchor);
            this.setLeftAnchor(pLeftAnchor);
            this.setBottomAnchor(pBottomAnchor);
            this.setRightAnchor(pRightAnchor);
        }
        else {
            console.log('No Valid Arguments for Constraints')
        }
    }

    getTopAnchor() {
        return this.topAnchor;
    }

    getLeftAnchor() {
        return this.leftAnchor;
    }

    getBottomAnchor() {
        return this.bottomAnchor;
    }

    getRightAnchor() {
        return this.rightAnchor;
    }

    setTopAnchor(pTopAnchor) {
        this.topAnchor = pTopAnchor;
    }

    setLeftAnchor(pLeftAnchor) {
        this.leftAnchor = pLeftAnchor;
    }

    setBottomAnchor(pBottomAnchor) {
        this.bottomAnchor = pBottomAnchor;
    }

    setRightAnchor(pRightAnchor) {
        this.rightAnchor = pRightAnchor;
    }
}