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

import tinycolor from "tinycolor2";

const defaultTransforms = {
    'csv': (v:string) => {
        if (v.includes("rgb") || v.includes("hsl")) {
            if (tinycolor(v.substring(0, v.indexOf('), ') + 1)).isValid() && tinycolor(v.substring(v.indexOf('), ') + 4)).isValid()) {
                return [tinycolor(v.substring(0, v.indexOf('), ') + 1)).toHexString(), tinycolor(v.substring(v.indexOf('), ') + 4)).toHexString()]
            }
        }
        return v.split(',').map(v => v.trim())
    } ,
    'float': (v:string) => parseFloat(v),
};

interface CSSMapping { 
    cssVar: string, 
    transform?: Function | keyof typeof defaultTransforms, 
    defaultValue?: any 
}

/**
 * Fetches settings from css variables
 * @param mapping - An object specifying the mapping from css to resulting object
 * @param elem - Optional reference element to use for css variable fetching
 * @returns An Object with the mapped values
 */
export default function getSettingsFromCSSVar(mapping: Record<string, string | CSSMapping>, elem?: HTMLElement | null) {
    const style = getComputedStyle(elem || document.body);

    const out:any = {}
    Object.keys(mapping).forEach(k => {
        const m = mapping[k];
        var cssVar:string, transform: CSSMapping["transform"], defaultValue;
        if(typeof m === "string") {
            cssVar = m;
        } else {
            cssVar = m.cssVar;
            transform = m.transform
            defaultValue = m.defaultValue
        }
        const v = style.getPropertyValue(cssVar).trim();
        if (transform) {
            const t = typeof transform === 'function' ? transform : defaultTransforms[transform];
            
            out[k] = t(v) || defaultValue;
        } else {
            out[k] = v || defaultValue;
        }
    })
    return out
}