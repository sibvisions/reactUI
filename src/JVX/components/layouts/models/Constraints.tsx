import Anchor from "./Anchor";

class Constraints{
    topAnchor: Anchor;
    leftAnchor: Anchor;
    bottomAnchor: Anchor;
    rightAnchor: Anchor;

    constructor(topAnchor: Anchor, leftAnchor: Anchor, bottomAnchor: Anchor, rightAnchor: Anchor) {
        this.rightAnchor = rightAnchor;
        this.bottomAnchor = bottomAnchor;
        this.leftAnchor = leftAnchor;
        this.topAnchor = topAnchor
    }
}
export default Constraints