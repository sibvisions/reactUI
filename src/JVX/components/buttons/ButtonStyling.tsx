/** React imports */
import {CSSProperties} from 'react';

/** 3rd Party imports */
import tinycolor from 'tinycolor2';

/** Other imports */
import {checkAlignments} from "../compprops/CheckAlignments";
import {getFont, getMargins, parseIconData} from '../compprops/ComponentProperties';
import IconProps from '../compprops/IconProps';
import {IButton} from "./IButton";

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
            justifyContent: props.horizontalTextPosition !== 1 ? checkAlignments(props).ha : checkAlignments(props).va,
            alignItems: props.horizontalTextPosition !== 1 ? checkAlignments(props).va : checkAlignments(props).ha,
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
function getGapPos(hTextPos:number|undefined, vTextPos:number|undefined) {
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

/**
 * Centers an element relative to the measured length of another element
 * @param centerElem - the element to be centered
 * @param labelElem - label element
 * @param hAlign - horizontalAlignment of button
 */
export function centerElem(centerElem:HTMLElement, labelElem:HTMLElement, hAlign:number|undefined) {
    let labelWidth = labelElem.offsetWidth/2;
    let centerWidth = centerElem.offsetWidth/2;
        if (hAlign === 0 || (!hAlign && !centerElem.classList.contains('rc-button-icon')))
            centerElem.style.setProperty('margin-left', labelWidth-centerWidth + 'px')
        else if (hAlign === 2)
            centerElem.style.setProperty('margin-right', labelWidth-centerWidth + 'px')
}

/**
 * Sets styling of RadioButtons and Checkboxes
 * @param btnElement - element of the RadioButton or CheckBox
 * @param lblElement - label element
 * @param props - properties of the RadioButton or CheckBox
 * @param iconProps - properties of the icon
 * @param resource - resource string to get images
 */
export function renderRadioCheck(btnElement:HTMLElement, lblElement:HTMLElement, props:IButton, iconProps:IconProps, resource:string) {
    btnElement.style.setProperty('margin-' + getGapPos(props.horizontalTextPosition, props.verticalTextPosition), '4px');
    if (props.horizontalTextPosition === 1)
        centerElem(btnElement, lblElement, props.horizontalAlignment)
    if (iconProps.icon)
        renderButtonIcon(lblElement.children[0] as HTMLElement, props, iconProps, resource);
}

/**
 * Sets the styling of an icon for a button
 * @param iconElement - the element which contains the icon
 * @param props - properties of the button
 * @param iconProps - properties of the icon
 * @param resource  - resource strong to get images
 */
export function renderButtonIcon(iconElement:HTMLElement, props:IButton, iconProps:IconProps, resource:string) {
    iconElement.classList.add("rc-button-icon")
    const gapPos = iconElement.tagName === 'SPAN' ? getGapPos(props.horizontalTextPosition, props.verticalTextPosition) : 'right';
    iconElement.style.setProperty('margin-' + gapPos, (props.imageTextGap ? props.imageTextGap : 4)+'px');
    if (!iconProps.icon?.includes('fa fa-')) {
        iconElement.style.setProperty('display', 'inline-block');
        iconElement.style.setProperty('width', iconProps.size?.width+'px');
        iconElement.style.setProperty('height', iconProps.size?.height+'px');
    }
    iconElement.style.setProperty('font-size', iconProps.size?.height+'px');
    iconElement.style.setProperty('color', iconProps.color ? iconProps.color : null);
    if (!iconElement.classList.value.includes('fa fa-')) {
        iconElement.style.setProperty('background-image', 'url(' + resource + iconProps.icon + ')');
    }
}

/**
 * Adds a hover effect to buttons through mouseevents
 * @param obj - the button which receives the hover effect
 * @param borderOnMouseEntered - if border should appear on mouse enter
 * @param color - the original color of the button
 * @param checkedColor - color if the button is checked (togglebutton) null if not togglebutton
 * @param dark - the percentage of how much the hovered color should be darker
 * @param borderPainted  - if the border of the button is painted
 * @param checked - if a togglebutton is checked undefined if not togglebutton
 * @param bgdSet - if there is a background set by the server
 */
export function addHoverEffect(obj:HTMLElement, borderOnMouseEntered:boolean|undefined, color:string, checkedColor:string|null, dark: number, borderPainted:boolean, checked:boolean|undefined, bgdSet:boolean) {
    const btnDefaultBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    if (borderPainted) {
        obj.onmouseover = () => {
            if (!checked) {
                obj.style.setProperty('background', tinycolor(color).darken(dark).toString());
                obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
            }
            else if (checkedColor) {
                obj.style.setProperty('background', checkedColor);
                obj.style.setProperty('border-color', checkedColor);
            }
        }
        obj.onmouseout = () => {
            if (!checked) {
                if (!bgdSet) {
                    obj.style.removeProperty('background');
                    obj.style.removeProperty('border-color');
                }
                else {
                    obj.style.setProperty('background', color ? color : null)
                    obj.style.setProperty('border-color', color ? color : null)
                }
            }
        }
    }
    else if (borderOnMouseEntered) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', color === 'white' ? color : btnDefaultBgd);
            obj.style.setProperty('border-color', color === 'white' ? color : btnDefaultBgd);
        }
        obj.onmouseout = () => {
            if (!checked) {
                if (!bgdSet) {
                    obj.style.removeProperty('background');
                    obj.style.removeProperty('border-color');
                }
                else {
                    obj.style.setProperty('background', color ? color : null);
                    obj.style.setProperty('border-color', color ? color : null);
                }
            }
        }
    }
}