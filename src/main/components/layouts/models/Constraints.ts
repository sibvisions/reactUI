/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { Anchor } from "@sibvisions/visionx/dist/moduleIndex";

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