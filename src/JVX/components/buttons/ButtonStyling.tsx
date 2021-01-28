import {CSSProperties} from 'react';
import tinycolor from 'tinycolor2';
import {checkAlignments} from "../compprops/CheckAlignments";
import {getFont, getMargins, parseIconData} from '../compprops/ComponentProperties';
import IconProps from '../compprops/IconProps';
import {IButton} from "./IButton";
import { ToggleButtonGradient } from './togglebutton/UIToggleButton';

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

export function centerElem(centerElem:HTMLElement, labelElem:HTMLElement, hAlign:number|undefined) {
    let labelWidth = labelElem.offsetWidth/2;
    let centerWidth = centerElem.offsetWidth/2;
        if (hAlign === 0 || (!hAlign && !centerElem.classList.contains('rc-button-icon')))
            centerElem.style.setProperty('margin-left', labelWidth-centerWidth + 'px')
        else if (hAlign === 2)
            centerElem.style.setProperty('margin-right', labelWidth-centerWidth + 'px')
}

export function renderRadioCheck(btnElement:HTMLElement, lblElement:HTMLElement, props:IButton, iconProps:IconProps, resource:string) {
    btnElement.style.setProperty('margin-' + getGapPos(props.horizontalTextPosition, props.verticalTextPosition), '4px');
    if (props.horizontalTextPosition === 1)
        centerElem(btnElement, lblElement, props.horizontalAlignment)
    if (iconProps.icon)
        renderButtonIcon(lblElement.children[0] as HTMLElement, props, iconProps, resource);
}

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
    if (!iconElement.classList.value.includes('fa')) {
        iconElement.style.setProperty('background-image', 'url(' + resource + iconProps.icon + ')');
    }
}

export function setMenuButtonPadding(defaultButton:HTMLElement, padding:string[]|undefined) {
    if (padding) {
        defaultButton.style.setProperty('padding-top', padding[0]);
        defaultButton.style.setProperty('padding-right', padding[1]);
        defaultButton.style.setProperty('padding-bottom', padding[2]);
        defaultButton.style.setProperty('padding-left', padding[3]);
    }
}

export function addHoverEffect(obj:HTMLElement, borderOnMouseEntered:boolean|undefined, color:string, checkedColor:ToggleButtonGradient|null, dark: number, borderPainted:boolean, checked:boolean|undefined, bgdSet:boolean) {
    const btnDefaultBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    if (borderPainted) {
        obj.onmouseover = () => {
            if (!checked) {
                obj.style.setProperty('background', tinycolor(color).darken(dark).toString());
                obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
            }
            else if (checkedColor) {
                obj.style.setProperty('background', "linear-gradient(to bottom, " + checkedColor.upperGradient + " 2%, " + checkedColor.lowerGradient + "98%)" );
                console.log(color)
                obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
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