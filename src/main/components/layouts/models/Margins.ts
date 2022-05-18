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

/** Class for margins of layouts or components */
class Margins{
    /** The top margin */
    marginTop = 0;
    /** The left margin */
    marginLeft = 0;
    /** The bottom margin */
    marginBottom = 0;
    /** The right margin */
    marginRight = 0;

    /**
     * @constructor - constructs new margins based on the given marginArray
     * @param marginsArray - the data used for the Margins
     */
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