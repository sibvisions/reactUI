import { Anchor } from "../";

/** The Constraint stores the top, left, bottom and right Anchor for layouting a component */
class Constraints{
    /** The top anchor */
    topAnchor: Anchor;
    /** The left anchor */
    leftAnchor: Anchor;
    /** The bottom anchor */
    bottomAnchor: Anchor;
    /** The right anchor */
    rightAnchor: Anchor;

    /**
     * @constructor Constructs constraint with given anchors as bounds
     * @param topAnchor - the top anchor
     * @param leftAnchor - the left anchor
     * @param bottomAnchor - the bottom anchor
     * @param rightAnchor - the right anchor
     */
    constructor(topAnchor: Anchor, leftAnchor: Anchor, bottomAnchor: Anchor, rightAnchor: Anchor) {
        this.rightAnchor = rightAnchor;
        this.bottomAnchor = bottomAnchor;
        this.leftAnchor = leftAnchor;
        this.topAnchor = topAnchor
    }
}
export default Constraints