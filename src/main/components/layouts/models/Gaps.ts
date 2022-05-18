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

/** Class for Gaps between components in layouts */
class Gaps{
    /** The vertical gap of a layout */
    verticalGap = 0;
    /** The horizontal gap of a layout */
    horizontalGap = 0;

    /**
     * @constructor - constructs new gaps based on the given data
     * @param gapsArray - the data used to define gaps
     */
    constructor(gapsArray? : Array<string>) {
        if(gapsArray){
            this.verticalGap = parseInt(gapsArray[1]);
            this.horizontalGap = parseInt(gapsArray[0]);
        }
    }
}
export default Gaps