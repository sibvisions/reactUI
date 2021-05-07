/** React imports */
import { CSSProperties } from 'react';

/** 3rd Party imports */
import tinycolor from 'tinycolor2';

/** Other imports */
import { getAlignments, getFont, getMargins, IconProps, parseIconData } from '../compprops';
import { IButton } from ".";

/**
 * @param props - buttonproperties received by the server
 * @returns data on how the button should be displayed
 */
export function buttonProps(props:IButton): {iconPos:string, tabIndex:number, style:CSSProperties, iconProps:IconProps, btnImgTextGap:number, btnBorderPainted:boolean} {
    const margins = getMargins(props.margins);
    const font = getFont(props.font);
    return {
        iconPos: (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) ? "right" : "left",
        tabIndex: props.focusable !== false ? (props.tabIndex ? props.tabIndex : 0) : -1,
        style: {
            flexDirection: props.horizontalTextPosition === 1 ? "column" : undefined,
            justifyContent: props.horizontalTextPosition !== 1 ? getAlignments(props).ha : getAlignments(props).va,
            alignItems: props.horizontalTextPosition !== 1 ? getAlignments(props).va : getAlignments(props).ha,
            background: props.background ? tinycolor(props.background).toString() : undefined,
            borderColor: props.background ? tinycolor(props.background).toString() : undefined,
            color: props.foreground ? tinycolor(props.foreground).toString() : undefined,
            padding: margins ? margins.marginTop + 'px ' + margins.marginRight + 'px ' + margins.marginBottom + 'px ' + margins.marginLeft + 'px' : undefined,
            fontFamily: font ? font.fontFamily : undefined,
            fontWeight: font ? font.fontWeight : undefined,
            fontStyle: font ? font.fontStyle : undefined,
            fontSize: font ? font.fontSize : undefined
        },
        iconProps: parseIconData(props.foreground, props.image),
        btnImgTextGap: props.imageTextGap ? props.imageTextGap : 4,
        btnBorderPainted: props.borderPainted !== false ? true : false
    }
}

/**
 * When a Button has an icon, the label and icon are seperated by a margin this function determines on which position the margin is
 * @param hTextPos - horizontalTextPosition of the button label
 * @param vTextPos  - verticalTextPosition of the button label 
 * @returns the position for the gap between label and icon
 */
export function getGapPos(hTextPos:number|undefined, vTextPos:number|undefined) {
    if (hTextPos === 0) {
        return 'left'
    }
    else if (hTextPos === undefined) {
        return 'right'
    }
    else if (hTextPos === 1 && vTextPos === 2) {
        return 'bottom'
    }
    else if (hTextPos === 1 && vTextPos === 0) {
        return 'top'
    }
}

export function getIconCenterDirection(hTextPos:number|undefined, hAlign:number|undefined) {
    if (hTextPos === 1) {
        if (hAlign === 0 || !hAlign) {
            return 'icon-center-left';
        }
        else if (hAlign === 2) {
            return 'icon-center-right'
        }
    }
    return '';
}