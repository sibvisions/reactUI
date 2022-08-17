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

// Interface for button-style
interface IButtonStyle {
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
 * This hook returns style properties used by all button components
 * @param props - the properties of the button
 * @param layoutStyle - the layoutstyle of the button
 * @param ref - an element reference to center the button content
 * @param ref2 - an extra element reference to center button content, needed for checkbox and radiobutton
 * @returns style properties used by all button components
 */
const useButtonStyling = (props: IButton, layoutStyle?: CSSProperties, compStyle?: CSSProperties, ref?: HTMLElement, ref2?: HTMLElement): IButtonStyle => {
    /** The margins of a button */
    const margins = useMemo(() => getMargins(props.margins), [props.margins]);

    /** Various style properties which are set by the properties received from the server */
    const buttonStyle: CSSProperties = useMemo(() => {
        let btnBackground = compStyle?.background ? compStyle.background as string : undefined;
        let btnJustify = props.horizontalTextPosition !== 1 ? getAlignments(props).ha : getAlignments(props).va;
        let btnAlign = props.horizontalTextPosition !== 1 ? getAlignments(props).va : getAlignments(props).ha;

        if (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON) {
            if (!btnBackground) {
                btnBackground = "transparent"
            }

            if (!btnJustify) {
                btnJustify = props.horizontalTextPosition !== 1 ? 'flex-start' : 'center';
            }

            if (!btnAlign) {
                btnAlign = props.horizontalTextPosition !== 1 ? 'center' : 'flex-start';
            }
        }
        else {
            if (!btnBackground) {
                btnBackground = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            }

            if (!btnJustify) {
                btnJustify = "center";
            }

            if (!btnAlign) {
                btnAlign = "center";
            }
        }

        return {
            ...compStyle,
            background: btnBackground,
            borderColor: btnBackground,
            flexDirection: props.horizontalTextPosition === 1 ? "column" : undefined,
            justifyContent: btnJustify,
            alignItems: btnAlign,
            padding: margins ? margins.marginTop + 'px ' + margins.marginRight + 'px ' + margins.marginBottom + 'px ' + margins.marginLeft + 'px' : undefined,
        }
    }, [compStyle, props.horizontalTextPosition, margins]);

    /** The image property parsed as usable icon props */
    const iconProps = useMemo(() => parseIconData(compStyle?.color as string, props.image), [compStyle?.color, props.image]);

    /** The position of the icon */
    const iconPos = useMemo(() => {
        if (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) {
            return "right"
        }
        return "left"
    }, [props.horizontalTextPosition, props.verticalTextPosition]);

    /** Centering the contents of a button (icon, text) */
    const iconCenterGap = useMemo(() => {
        if (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON) {
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
        return "left"
    }, [props.horizontalTextPosition, props.verticalTextPosition]);

    /** If the icon is left or right of the center */
    const iconDirection = useMemo(() => {
        if (props.horizontalTextPosition === 1) {
            if (!props.horizontalAlignment) {
                return "icon-center-left";
            }
            else if (props.horizontalAlignment) {
                return 'icon-center-right';
            }
        }
        return "";
    }, [props.horizontalTextPosition, props.horizontalAlignment])

    /** True, if the border is painted */
    const borderPainted = useMemo(() => props.borderPainted !== false ? true : false, [props.borderPainted]);

    /** The parsed icon properties of the icon which is displayed when pressing the button */
    const pressedIconData = useMemo(() => parseIconData(compStyle?.color as string, props.mousePressedImage), [compStyle?.color, props.mousePressedImage]);

    /** The parsed icon properties of the icon which is displayed when hovering the mouse over the button */
    const mouseOverIconData = useMemo(() => parseIconData(compStyle?.color as string, props.mouseOverImage), [compStyle?.color, props.mouseOverImage]);

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