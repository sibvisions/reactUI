import { CSSProperties } from "react";
import { Dimension, parsePrefSize } from ".";

/**
 * Returns the style of the panel/layout.
 * @param group - True, if the panel is a group-panel
 * @param layoutStyle - The calculated layout-style if available
 * @param prefSize - the preferred-size sent by the server
 * @param modal - True, if the screen is a popup
 * @param modalSize - The size of the popup sent by the server
 * @returns the style of the panel/layout.
 */
export function panelGetStyle(group:boolean, layoutStyle?:CSSProperties, prefSize?:Dimension, modal?:boolean, modalSize?:string) {
    let s:CSSProperties = {};
    /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
    if (modal) {
        const screenSize = parsePrefSize(modalSize);
        if (screenSize) {
            s = { ...layoutStyle, height: screenSize.height, width: screenSize.width }
        }
        else if (prefSize) {
            s = { ...layoutStyle, height: prefSize.height, width: prefSize.width };
        }
    }
    else {
        s = {...layoutStyle}
    }

    if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
        s.top = undefined;
        s.left = undefined;
    }

    /** Tell layout that because of the group-panel header it is ~28px smaller */
    if (group) {
        if (s.height !== undefined)  {
            (s.height as number) -= 28;
        }
    }
    return s
}