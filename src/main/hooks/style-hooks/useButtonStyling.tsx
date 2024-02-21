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

import { CSSProperties, useMemo } from "react";
import { IButton } from "../../components/buttons/IButton";
import { getMargins, parseIconData } from "../../components/comp-props/ComponentProperties";
import { getAlignments } from "../../components/comp-props/GetAlignments";
import IconProps from "../../components/comp-props/IconProps";
import COMPONENT_CLASSNAMES from "../../components/COMPONENT_CLASSNAMES";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import useButtonBackground from "./useButtonBackground";
import { IEditorCheckBox } from "../../components/editors/checkbox/UIEditorCheckbox";
import { isCheckboxCellEditor } from "../../components/buttons/button/UIButton";
import { IComponentConstants } from "../../components/BaseComponent";

// Interface for button-style
export interface IButtonStyle {
    style: CSSProperties,
    iconProps: IconProps,
    iconPos: "left" | "right",
    iconCenterGap: number,
    iconGapPos: "left" | "right" | "top" | "bottom",
    borderPainted: boolean,
    tabIndex: number|undefined,
    iconDirection: "icon-center-left" | "icon-center-right" | "",
    pressedIconProps: IconProps | undefined,
    mouseOverIconProps: IconProps | undefined
}

/**
 * Returns true, if the two arrays share at least one value
 * @param array1 - the first array
 * @param array2 - the second array
 * @returns 
 */
function hasSameValue(array1: string[], array2: string[]): boolean {
    // check each value in array1
    for (const value of array1) {
        // Check, if the value is in array2
        if (array2.includes(value)) {
            return true; // value found
        }
    }
    
    // no value found
    return false;
}

const cbStyles = ["ui-switch", "ui-togglebutton", "ui-button"];

/**
 * This hook returns style properties used by all button components
 * @param props - the properties of the button
 * @param layoutStyle - the layoutstyle of the button
 * @param ref - an element reference to center the button content
 * @param ref2 - an extra element reference to center button content, needed for checkbox and radiobutton
 * @returns style properties used by all button components
 */
const useButtonStyling = (props: IButton & IComponentConstants |IEditorCheckBox & IComponentConstants, layoutStyle?: CSSProperties, compStyle?: CSSProperties, ref?: HTMLElement, ref2?: HTMLElement): IButtonStyle => {
    /** The margins of a button */
    const margins = useMemo(() => getMargins(props.margins), [props.margins]);

    /** Rerender triggers when the button background changes */
    const designerBgdChanged = useButtonBackground();

    /** Various style properties which are set by the properties received from the server */
    const buttonStyle: CSSProperties = useMemo(() => {
        const isCB = isCheckboxCellEditor(props);
        if (!isCB && props.url) { return {} }  
        
        const isCBOrRB = isCB ? 
                        !hasSameValue(cbStyles, props.cellEditor_style_ ? props.cellEditor_style_?.split(',') : props.cellEditor?.style?.split(',') || []) 
                        : 
                        (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON);
        let btnBackground = compStyle?.background ? compStyle.background as string : isCBOrRB ? "transparent" : window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        const alignments = getAlignments(props);
        let btnJustify: string|undefined = !isCB && props.horizontalTextPosition === 1 ? alignments.va : alignments.ha;
        let btnAlign: string|undefined = !isCB && props.horizontalTextPosition === 1 ? alignments.ha : alignments.va;

        if (!isCBOrRB) {
            if (!btnJustify) {
                btnJustify = 'center';
            }

            if (!btnAlign) {
                btnAlign = 'center';
            }
        }
        else {
            if (!btnJustify) {
                btnJustify = !isCB && props.horizontalTextPosition === 1 ? 'center' : 'flex-start';
            }

            if (!btnAlign) {
                btnAlign = !isCB && props.horizontalTextPosition === 1 ? 'flex-start' : 'center';
            }
        }

        return {
            ...compStyle,
            background: btnBackground,
            borderColor: btnBackground,
            flexDirection: !isCB && props.horizontalTextPosition === 1 ? "column" : undefined,
            justifyContent: btnJustify,
            alignItems: btnAlign,
            padding: margins ? margins.marginTop + 'px ' + margins.marginRight + 'px ' + margins.marginBottom + 'px ' + margins.marginLeft + 'px' : undefined,
        }
    }, [compStyle, !isCheckboxCellEditor(props) ? props.horizontalTextPosition : undefined, margins, designerBgdChanged]);

    /** The image property parsed as usable icon props */
    const iconProps = useMemo(() => parseIconData(compStyle?.color as string, props.image), [compStyle?.color, props.image]);

    /** The position of the icon */
    const iconPos = useMemo(() => {
        const isCB = isCheckboxCellEditor(props);
        if (!isCB) {
            if (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) {
                return "right"
            }
        }

        return "left"
    }, [!isCheckboxCellEditor(props) ? props.horizontalTextPosition : undefined, !isCheckboxCellEditor(props) ? props.verticalTextPosition : undefined]);

    /** Centering the contents of a button (icon, text) */
    const iconCenterGap = useMemo(() => {
        if (!isCheckboxCellEditor(props) && props.url) {
            return 0;
        }
        const isCB = isCheckboxCellEditor(props);
        const isCBOrRB = isCB ? 
        !hasSameValue(cbStyles, props.cellEditor_style_ ? props.cellEditor_style_?.split(',') : props.cellEditor?.style?.split(',') || []) 
        : 
        (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON);
        if (isCBOrRB) {
            if (ref && ref2) {
                return ref.offsetWidth / 2 - ref2.offsetWidth / 2
            }
        }
        else {
            if (ref) {
                return (ref.children[1] as HTMLElement).offsetWidth / 2 - (iconProps.size?.width ? iconProps.size?.width / 2 : (ref.children[0] as HTMLElement).offsetWidth / 2);
            }
        }
        return 0;
    }, [layoutStyle?.width, layoutStyle?.height]);

    /** Where the icon gap is supposed to be */
    const iconGapPos = useMemo(() => {
        if (!isCheckboxCellEditor(props)) {
            if (props.horizontalTextPosition === undefined) {
                return "right";
            }
            else if (props.horizontalTextPosition === 1 && (props.verticalTextPosition === 2 || props.verticalTextPosition === undefined)) {
                return "bottom";
            }
            else if (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0) {
                return "top";
            }
            else if (props.horizontalTextPosition === 0) {
                return "left";
            }
        }
        return "right"
    }, [!isCheckboxCellEditor(props) ? props.horizontalTextPosition : undefined, !isCheckboxCellEditor(props) ? props.verticalTextPosition : undefined]);

    /** If the icon is left or right of the center */
    const iconDirection = useMemo(() => {
        if (!isCheckboxCellEditor(props)) {
            if (props.horizontalTextPosition === 1) {
                if (!props.horizontalAlignment) {
                    return "icon-center-left";
                }
                else if (props.horizontalAlignment) {
                    return 'icon-center-right';
                }
            }
        }

        return "";
    }, [!isCheckboxCellEditor(props) ? props.horizontalTextPosition : undefined, !isCheckboxCellEditor(props) ? props.horizontalAlignment : undefined])

    /** True, if the border is painted */
    const borderPainted = useMemo(() => isCheckboxCellEditor(props) || props.borderPainted !== false ? true : false, [!isCheckboxCellEditor(props) ? props.borderPainted : undefined]);

    /** The parsed icon properties of the icon which is displayed when pressing the button */
    const pressedIconData = useMemo(() => parseIconData(compStyle?.color as string, !isCheckboxCellEditor(props) ? props.mousePressedImage : undefined), [compStyle?.color, !isCheckboxCellEditor(props) ? props.mousePressedImage: undefined]);

    /** The parsed icon properties of the icon which is displayed when hovering the mouse over the button */
    const mouseOverIconData = useMemo(() => parseIconData(compStyle?.color as string, !isCheckboxCellEditor(props) ? props.mouseOverImage : undefined), [compStyle?.color, !isCheckboxCellEditor(props) ? props.mouseOverImage : undefined]);

    return {
        style: buttonStyle,
        iconProps: iconProps,
        iconPos: iconPos,
        iconCenterGap: iconCenterGap,
        iconGapPos: iconGapPos,
        iconDirection: iconDirection,
        borderPainted: borderPainted,
        tabIndex: getTabIndex(props.focusable, props.tabIndex),
        pressedIconProps: pressedIconData,
        mouseOverIconProps: mouseOverIconData
    }
}
export default useButtonStyling