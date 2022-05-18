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

/** Class for NullLayout Bounds */
class Bounds{
    /** Value for left positioning */
    left: number = 0;
    /** Value for top positioning */
    top: number = 0;
    /** Value for height of component */
    height: number = 0;
    /** Value for width of component */
    width: number = 0;

    /**
     * @constructor sets the boundsdata
     * @param boundsArray - the boundsdata
     */
    constructor(boundsArray: string[]){
        if(boundsArray){
            this.left = parseInt(boundsArray[0]);
            this.top = parseInt(boundsArray[1]);
            this.width = parseInt(boundsArray[2]);
            this.height = parseInt(boundsArray[3]);
        } else {
            console.warn("Bounds was not given the right arguments")
        }
    }
}
export default Bounds