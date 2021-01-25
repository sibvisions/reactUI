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
            justifyContent: checkAlignments(props).ha,
            alignItems: checkAlignments(props).va,
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

function styleButtonContent(child:HTMLElement, className:string, hTextPos:number|undefined, vTextPos:number|undefined, imgTextGap:number|undefined, iconProps:any, resource:string) {
    if (child.parentElement !== null) {
        if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
            let gapPos = getGapPos(hTextPos, vTextPos);
            if (!child.classList.contains('p-ink'))
                child.style.setProperty('margin-' + gapPos, (imgTextGap ? imgTextGap : 4)+'px');
        }
        if (iconProps) {
            if (child.classList.value.includes(iconProps.icon)) {
                child.classList.add("rc-button-icon")
                child.style.setProperty('width', iconProps.size.width+'px');
                child.style.setProperty('height', iconProps.size.height+'px');
                child.style.setProperty('font-size', iconProps.size.height+'px');
                child.style.setProperty('color', iconProps.color);
                if (!child.classList.value.includes('fa')) {
                    child.style.setProperty('background-image', 'url(' + resource + iconProps.icon + ')');
                }
            }
        }
    }
}

function fontColorForBgd(btn:Element, btnStyle:CSSProperties) {
    if (!btn.classList.contains('border-notpainted')) {
        const colorString:string = window.getComputedStyle(btn).getPropertyValue('background-color')
        const rgb = colorString.substring(colorString.indexOf('(')+1, colorString.indexOf(')')).replaceAll(' ', '').split(',');
        const colorNotSet = (window.getComputedStyle(btn).getPropertyValue('background-color') === 'rgba(0, 0, 0, 0)' && !btnStyle.background) ? true : false;
        const brightness = Math.round(((parseInt(rgb[0]) * 299) +
                          (parseInt(rgb[1]) * 587) +
                          (parseInt(rgb[2]) * 114)) / 1000);
        const textColor = (brightness > 126 || colorNotSet) ? 'black' : 'white';
        (btn as HTMLElement).style.setProperty('color', textColor);
    }
}

export function styleButton(btn:Element, className:string, hTextPos:number|undefined, vTextPos:number|undefined, 
    imgTextGap:number|undefined, btnStyle:CSSProperties, iconProps:IconProps, resource:string) {
    fontColorForBgd(btn, btnStyle);
    if (className === "PopupMenuButton") {
        const paddings = btnStyle.padding?.toString().split(' ') as string[];
        const defaultButton = btn.children[0] as HTMLElement;
        defaultButton.style.setProperty('padding-top', paddings[0]);
        defaultButton.style.setProperty('padding-bottom', paddings[2]);
        defaultButton.style.setProperty('padding-left', paddings[1]);
        for (let btnChild of btn.children) {
            for (let child of btnChild.children)
                styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, resource);
        }
    }
    else {
        for (let child of btn.children) {
            styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, resource)
        }
    }
}

export function addHoverEffect(obj:HTMLElement, className:string, borderOnMouseEntered:boolean|undefined, color:string|undefined, checkedColor:ToggleButtonGradient|null, dark: number, borderPainted:boolean, checked:boolean|undefined, bgdSet:boolean) {
    const btnDefaultBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    if (borderPainted) {
        obj.onmouseover = () => {
            if (!checked) {
                obj.style.setProperty('background', tinycolor(color).darken(dark).toString());
                obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
            }
            else if (checkedColor) {
                obj.style.setProperty('background', "linear-gradient(to bottom, " + checkedColor.upperGradient + " 2%, " + checkedColor.lowerGradient + "98%)" );
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