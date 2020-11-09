import {CSSProperties} from 'react';
import tinycolor from 'tinycolor2';
import {checkAlignments} from "../compprops/CheckAlignments";
import {getFont, getMargins, parseIconData} from '../compprops/ComponentProperties';
import IconProps from '../compprops/IconProps';
import {IButton} from "./IButton";

export function buttonProps(props:IButton): {iconPos:string, tabIndex:number|string, style:CSSProperties, iconProps:IconProps, btnImgTextGap:number, btnBorderPainted:boolean} {
    const margins = getMargins(props.margins);
    const font = getFont(props.font);
    return {
        iconPos: (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) ? "right" : "left",
        tabIndex: props.focusable !== false ? (props.tabIndex ? props.tabIndex : props.className === "ToggleButton" ? 0 : "0") : props.className === "ToggleButton" ? -1 : "-1",
        style: {
            flexDirection: props.horizontalTextPosition === 1 ? "column" : undefined,
            justifyContent: checkAlignments(props).ha,
            alignItems: checkAlignments(props).va,
            backgroundColor: getBtnBgdColor(props.borderPainted, props.background),
            color: props.foreground ? tinycolor(props.foreground).toString() : undefined,
            borderColor: getBtnBgdColor(props.borderPainted, props.background),
            paddingTop: margins ? margins.marginTop : undefined,
            paddingLeft: margins ? margins.marginLeft : undefined,
            paddingBottom: margins ? margins.marginBottom : undefined,
            paddingRight: margins ? margins.marginRight : undefined,
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

function styleMenuButton(btnChild:HTMLElement, btnStyle:CSSProperties) {
    btnChild.style.setProperty('padding-top', btnStyle.paddingTop+'px');
    btnChild.style.setProperty('padding-bottom', btnStyle.paddingBottom+'px');
    if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
        btnChild.style.setProperty('padding-left', btnStyle.paddingLeft+'px');
    }
    else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
        btnChild.style.setProperty('padding-right', btnStyle.paddingRight+'px');
    }
    btnChild.onfocus = () => {
        btnChild.parentElement?.style.setProperty('box-shadow', '0 0 0 0.2rem #8dcdff')
    }
    btnChild.onblur = () => {
        btnChild.parentElement?.style.removeProperty('box-shadow')
    }
}

function styleButtonContent(child:HTMLElement, className:string, hTextPos:number|undefined, vTextPos:number|undefined, imgTextGap:number|undefined, iconProps:any, resource:string) {
    if (child.parentElement !== null) {
        if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
            //if the button is a Radiobutton or a Checkbox and the hTextPos is 1, the Radiobutton/Checkbox gets moved to the center of the component
            if ((className === "RadioButton" || className === "CheckBox") && hTextPos === 1) {
                let alignment = window.getComputedStyle(child.parentElement).getPropertyValue('align-items')
                let labelElem = child.nextElementSibling as HTMLElement;
                let labelWidth = labelElem.offsetWidth/2;
                let childWidth = child.offsetWidth/2;
                //ha because if hTextPos = 1 ha and va get switched
                if (alignment === 'flex-start') {
                    child.style.setProperty('margin-left', labelWidth-childWidth+'px')
                }
                else if (alignment === 'flex-end') {
                    child.style.setProperty('margin-right', labelWidth-childWidth+'px')
                }
            }
            let gapPos = getGapPos(hTextPos, vTextPos);
            child.style.setProperty('margin-' + gapPos, (imgTextGap ? imgTextGap : 4)+'px');
        }
        if (iconProps) {
            if (child.classList.value.includes(iconProps.icon)) {
                child.classList.add("jvxButton-icon")
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

export function styleButton(btnChildren:HTMLCollection, className:string, hTextPos:number|undefined, vTextPos:number|undefined, 
    imgTextGap:number|undefined, btnStyle:CSSProperties, iconProps:IconProps, resource:string) {
    if (className === "PopupMenuButton") {
        for (let btnChild of btnChildren) {
            styleMenuButton(btnChild as HTMLElement, btnStyle);
            for (let child of btnChild.children)
                styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, resource);
        }
    }
    else {
        for (let child of btnChildren) {
            styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, resource)
        }
    }
}

export function addHoverEffect(obj:HTMLElement, className:string, borderOnMouseEntered:boolean|undefined, color:string|undefined, checkedColor:string|null, dark: number, borderPainted:boolean, checked:boolean|undefined, bgdSet:boolean) {
    if (borderPainted) {
        obj.onmouseover = () => {
            obj.style.setProperty('background-color', tinycolor(color).darken(dark).toString());
            obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
            if (className === "PopupMenuButton") {
                for (const child of obj.children) {
                    const castedChild = child as HTMLElement;
                    if (castedChild.tagName === "BUTTON")
                        castedChild.style.setProperty('border-color', tinycolor(color).darken(dark).toString())
                        
                }
            }
        }
        obj.onmouseout = () => {
            if (checked && checkedColor !== null) {
                if (!bgdSet) {
                    obj.style.removeProperty('background-color');
                    obj.style.removeProperty('border-color');
                }
                else {
                    obj.style.setProperty('background-color', checkedColor.toString());
                    obj.style.setProperty('border-color', checkedColor.toString());
                }
            }
            else {
                if (!bgdSet) {
                    obj.style.removeProperty('background-color');
                    obj.style.removeProperty('border-color');
                    if (className === "PopupMenuButton") {
                        for (const child of obj.children) {
                            const castedChild = child as HTMLElement;
                            if (castedChild.tagName === "BUTTON")
                                castedChild.style.removeProperty('border-color');
                        }
                    }
                }
                else {
                    obj.style.setProperty('background-color', color ? color : null)
                    obj.style.setProperty('border-color', color ? color : null)
                    if (className === "PopupMenuButton") {
                        for (const child of obj.children) {
                            const castedChild = child as HTMLElement;
                            if (castedChild.tagName === "BUTTON")
                                castedChild.style.setProperty('border-color', color ? color : null);
                        }
                    }
                }
            }
        }
    }
    else if (borderOnMouseEntered) {
        obj.onmouseover = () => {
            obj.style.setProperty('background-color', color === 'white' ? color : "#007ad9");
            obj.style.setProperty('border-color', color === 'white' ? color : "#007ad9");
            if (className === "PopupMenuButton") {
                for (const child of obj.children) {
                    const castedChild = child as HTMLElement;
                    if (castedChild.tagName === "BUTTON")
                        castedChild.style.setProperty('border-color', color !== undefined ? color : "#007ad9");
                }
            }
        }
        obj.onmouseout = () => {
            if (checked && checkedColor !== null) {
                if (!bgdSet) {
                    obj.style.removeProperty('background-color');
                    obj.style.removeProperty('border-color');
                }
                else {
                    obj.style.setProperty('background-color', checkedColor.toString());
                    obj.style.setProperty('border-color', checkedColor.toString());
                }
            }
            else {
                if (!bgdSet) {
                    obj.style.removeProperty('background-color');
                    obj.style.removeProperty('border-color');
                    if (className === "PopupMenuButton") {
                        for (const child of obj.children) {
                            const castedChild = child as HTMLElement;
                            if (castedChild.tagName === "BUTTON")
                            castedChild.style.removeProperty('border-color');
                        }
                    }
                }
                else {
                    obj.style.setProperty('background-color', color ? color : null);
                    obj.style.setProperty('border-color', color ? color : null);
                    if (className === "PopupMenuButton") {
                        for (const child of obj.children) {
                            const castedChild = child as HTMLElement;
                            if (castedChild.tagName === "BUTTON")
                            castedChild.style.setProperty('border-color', color ? color : null);
                        }
                    }
                }
            }
        }
    }
}

function getBtnBgdColor(borderPainted: boolean | undefined, background: string | undefined) {
    if (background)
        return tinycolor(background).toString();
    else {
        return undefined;
    }
}