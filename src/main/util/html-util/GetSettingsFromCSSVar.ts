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

/** Transforms rgb/hsl colors to hex colors */
const defaultTransforms = {
    'csv': (v:string) => {
        const regexMatch = (v.match(/(rgb|hsl|#)(\((\d+,\s*\d+%,\s*\d+%|\d+,\s*\d+,\s*\d+)\)|[0-9a-fA-F]{6})/g));
        if (regexMatch) {
            const colorArray = Array.from(regexMatch);
            if (colorArray.length) {
                return colorArray.map(color => tinycolor(color).toHexString());
            }
            else {
                const primaryColorMatch = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color').match(/(rgb|hsl|#)(\((\d+,\s*\d+%,\s*\d+%|\d+,\s*\d+,\s*\d+)\)|[0-9a-fA-F]{6})/g);
                if (primaryColorMatch?.length) {
                    return tinycolor(primaryColorMatch[0]).toHexString();
                }
            }
        }
        return ["#2196F3"];
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