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

/**
 * Helper class for fonts 
 */
class UIFont {
    /** font-family for component, default value is empty for standard css font-family */
    fontFamily = "";
    /** font-weight for component, default value is 400 for normal weight */
    fontWeight = 400;
    /** font-style for component, default value is normal */
    fontStyle = "normal";
    /** font-size for component, default value is css set standardFontSize */
    fontSize = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--font-size'));

    /**
     * @constructor - sets up a UIFont object
     * @param fontArray - server sent font-string already split up
     */
    constructor(fontArray?:Array<string>) {
        if (fontArray) {
            this.setFontFamily(fontArray[0]);
            this.setFontWeight(fontArray[1]);
            this.setFontStyle(fontArray[1]);
            this.setFontSize(fontArray[2]);
        }
    }

    /**
     * Sets the font-family
     * @param fontFamily - the font-family
     */
    setFontFamily(fontFamily:string) {
        this.fontFamily = fontFamily;
    }

    /**
     * Sets the font-weight
     * @param fontWeight - the font-weight
     */
    setFontWeight(fontWeight:string) {
        if (fontWeight === '1' || fontWeight === '3') {
            this.fontWeight = 700;
        }
    }

    /**
     * Sets the font-style
     * @param fontStyle - the font-style
     */
    setFontStyle(fontStyle:string) {
        if (fontStyle === '2' || fontStyle === '3') {
            this.fontStyle = 'italic';
        }
    }

    /**
     * Sets the font-size
     * @param fontSize - the font-size
     */
    setFontSize(fontSize:string) {
        if (fontSize !== null) {
            this.fontSize = parseInt(fontSize);
        }
    }
}
export default UIFont