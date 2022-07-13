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

import { CSSProperties, useLayoutEffect, useState } from "react"
import BaseComponent from "../../util/types/BaseComponent";

// map to quickly get to the syscolor css variables
const sysColorMap = new Map<string, string>([["mandatorybackground", "--mandatory-background"], ["readonlybackground", "--readonly-background"], ["invalideditorbackground", "invalid-background"]])

// Checks if the className contains a syscolor
export function isSysColor(className:string):string {
    if (["mandatorybackground", "readonlybackground", "invalideditorbackground"].indexOf(className) !== -1) {
        return className
    }
    return "";
}

/** Returns the color-properties for a component */
export function getColorProperties(color: string|undefined, isBackground: boolean):CSSProperties {
    const colorProperties: CSSProperties = {};
    if (color) {
        if (color.includes(";")) {
            const splitColor = color.split(";");
            //Filter out the className if available
            const className = splitColor[1].substring(splitColor[1].indexOf("_") + 1);

            let setColor;
            
            //Check if the className is a syscolor, if true take the value of the css variable, else just take the color sent by the server
            if (isSysColor(className)) {
                setColor = window.getComputedStyle(document.documentElement).getPropertyValue(sysColorMap.get(className) as string);
            }
            else {
                setColor = splitColor[0];
            }

            // Either set Background or Textcolor
            if (isBackground) {
                colorProperties.background = setColor;
            }
            else {
                colorProperties.color = setColor;
            }
        }
        else {
            if (isBackground) {
                colorProperties.background = color;
            }
            else {
                colorProperties.color = color;
            }
        }
    }

    return colorProperties;
}

/**
 * Returns the font properties parsed
 * @param font - the font string sent by the server
 */
export function getFontProperties(font?:string) {
    const fontProperties:CSSProperties = {};

    if (font) {
        const splitFont = font.split(",");
        
        if (splitFont[0] !== "Default") {
            fontProperties.fontFamily = splitFont[0];
        }

        switch (splitFont[1]) {
            case '1':
                fontProperties.fontWeight = "bold";
                break;
            case '2':
                fontProperties.fontStyle = "italic";
                break;
            case '3':
                fontProperties.fontWeight = "bold";
                fontProperties.fontStyle = "italic";
                break;
            default:
                break;
        }

        fontProperties.fontSize = splitFont[2];
    }
    return fontProperties;
};

/**
 * Returns the style as CSSProperties and if its initially set
 * @param props - the properties of the components
 */
const useComponentStyle = (props: BaseComponent):CSSProperties => {
    /** The componentstyle state */
    const [componentStyle, setComponentStyle] = useState<CSSProperties>({});

    // Everytime the font, background or foreground changes, check the componentstyle
    useLayoutEffect(() => {
            const fontProps = getFontProperties(props.font);
            const bgdProps = getColorProperties(props.background, true);
            const fgdProps = getColorProperties(props.foreground, false);

            setComponentStyle(prevStyle => ({ ...prevStyle, ...fontProps, ...bgdProps, ...fgdProps }));
    },[props.font, props.background, props.foreground])

    return componentStyle
}
export default useComponentStyle