import {CSSProperties} from 'react';
import tinycolor from 'tinycolor2';
import Alignments from '../compprops/Alignments';
import {checkAlignments} from "../compprops/CheckAlignments";
import {getFont, getMargins, parseIconData} from '../compprops/ComponentProperties';
import IconProps from '../compprops/IconProps';
import {IButton} from "./IButton";

export function buttonProps(props:IButton): {iconPos:string, tabIndex:number|string, style:CSSProperties, iconProps:IconProps, btnImgTextGap:number, btnBorderPainted:boolean, btnAlignments:Alignments} {
    const margins = getMargins(props);
    const font = getFont(props.font);
    return {
        iconPos: (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) ? "right" : "left",
        tabIndex: props.focusable !== false ? (props.tabIndex ? props.tabIndex : props.className === "ToggleButton" ? 0 : "0") : props.className === "ToggleButton" ? -1 : "-1",
        style: {
            display: "inline-flex",
            height: "inherit",
            width: "inherit",
            flexDirection: props.horizontalTextPosition === 1 ? "column" : "row",
            justifyContent: props.horizontalTextPosition !== 1 ? checkAlignments(props)?.ha : checkAlignments(props)?.va,
            alignItems: props.horizontalTextPosition !== 1 ? checkAlignments(props)?.va : checkAlignments(props)?.ha,
            backgroundColor: getBtnBgdColor(props).toString(),
            color: props.foreground ? tinycolor(props.foreground).toString() : props.className === "RadioButton" || props.className === "CheckBox" ? tinycolor('black').toString() : tinycolor('white').toString(),
            borderColor: getBtnBgdColor(props).toString(),
            paddingTop: margins.marginTop,
            paddingLeft: margins.marginLeft,
            paddingBottom: margins.marginBottom,
            paddingRight: margins.marginRight,
            fontFamily: font.fontFamily,
            //@ts-ignore
            fontWeight: font.fontWeight,
            fontStyle: font.fontStyle,
            fontSize: font.fontSize
        },
        iconProps: parseIconData(props, props.image),
        btnImgTextGap: props.imageTextGap ? props.imageTextGap : 4,
        btnBorderPainted: props.borderPainted !== false ? true : false,
        btnAlignments: checkAlignments(props)
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

export function styleButton(btn:HTMLElement, style:string|undefined) {
    if (btn.classList.contains("p-button-icon-only")) {
        for (let child of btn.children) {
            if (child.classList.contains("p-button-text"))
                child.remove();
        }
    }
    if (style && style.includes("hyperlink"))
        btn.classList.add("hyperlink");
}

function styleMenuButton(btnChild:HTMLElement, layoutHeight:number, layoutWidth:number, btnStyle:CSSProperties) {
    btnChild.style.setProperty('height', layoutHeight+'px');
    btnChild.style.setProperty('padding-top', btnStyle.paddingTop+'px');
    btnChild.style.setProperty('padding-left', btnStyle.paddingLeft+'px');
    btnChild.style.setProperty('padding-bottom', btnStyle.paddingBottom+'px');
    btnChild.style.setProperty('padding-right', btnStyle.paddingRight+'px');
    btnChild.style.setProperty('border-color', btnStyle.backgroundColor ? btnStyle.backgroundColor : null);
    btnChild.style.setProperty('color', btnStyle.color ? btnStyle.color : null);
    if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
        //@ts-ignore
        btnChild.style.setProperty('width', !(layoutWidth+'').includes('%') ? (layoutWidth-38)+'px' : 'calc(100% - 38px)');
        btnChild.style.setProperty('display', btnStyle.display ? btnStyle.display : null);
        btnChild.style.setProperty('flex-direction', btnStyle.flexDirection ? btnStyle.flexDirection : null);
        btnChild.style.setProperty('justify-content', btnStyle.justifyContent ? btnStyle.justifyContent : null);
        btnChild.style.setProperty('align-items', btnStyle.alignItems ? btnStyle.alignItems : null);  
    }
    else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
        btnChild.style.setProperty('width', '38px');
    }
    btnChild.onfocus = () => {
        btnChild.parentElement?.style.setProperty('box-shadow', '0 0 0 0.2rem #8dcdff')
    }
    btnChild.onblur = () => {
        btnChild.parentElement?.style.removeProperty('box-shadow')
    }
}

function styleButtonContent(child:HTMLElement, className:string, hTextPos:number|undefined, vTextPos:number|undefined, imgTextGap:number|undefined, iconProps:any, alignments:Alignments, resource:string) {
    if (child.parentElement !== null) {
        if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
            //if the button is a Radiobutton or a Checkbox and the hTextPos is 1, the Radiobutton/Checkbox gets moved to the center of the component
            if ((className === "RadioButton" || className === "CheckBox") && hTextPos === 1) {
                let alignment = alignments.ha
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
                child.style.setProperty('width', iconProps.size.width+'px');
                child.style.setProperty('height', iconProps.size.height+'px');
                child.style.setProperty('font-size', iconProps.size.height+'px');
                child.style.setProperty('color', iconProps.color);
                if (!child.classList.value.includes('fa')) {
                    child.style.setProperty('background-image', 'url(' + resource + iconProps.icon + ')');
                }
            }
        }
        child.style.setProperty('padding', 0+'px');
    }
}

export function styleChildren(btnChildren:HTMLCollection, className:string, hTextPos:number|undefined, vTextPos:number|undefined, 
    imgTextGap:number|undefined, btnStyle:CSSProperties, iconProps:IconProps, alignments:Alignments,
    layoutHeight:number|undefined, layoutWidth:number|undefined, resource:string) {
    if (className === "PopupMenuButton") {
        for (let btnChild of btnChildren) {
            if (layoutHeight !== undefined && layoutWidth !== undefined)
                styleMenuButton(btnChild as HTMLElement, layoutHeight, layoutWidth, btnStyle);
            for (let child of btnChild.children)
                styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, alignments, resource);
        }
    }
    else {
        for (let child of btnChildren) {
            styleButtonContent(child as HTMLElement, className, hTextPos, vTextPos, imgTextGap, iconProps, alignments, resource)
        }
    }
}

export function addHoverEffect(obj:HTMLElement, className:string, borderOnMouseEntered:boolean|undefined, color:string|undefined, checkedColor:string|null, dark: number, borderPainted:boolean, checked:boolean|undefined) {
    if (borderPainted) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', tinycolor(color).darken(dark).toString());
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
                obj.style.setProperty('background', checkedColor.toString());
                obj.style.setProperty('border-color', checkedColor.toString());
            }
            else {
                obj.style.setProperty('background', color ? color : null);
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
    else if (borderOnMouseEntered) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', color !== undefined ? color : "#007ad9");
            obj.style.setProperty('border-color', color !== undefined ? color : "#007ad9");
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
                obj.style.setProperty('background', checkedColor.toString())
                obj.style.setProperty('border-color', checkedColor.toString())
            }
            else {
                obj.style.setProperty('background', color ? color : null)
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

function getBtnBgdColor(props:IButton) {
    let btnColor = tinycolor('white'); 
    if (props.borderPainted !== false) {
        if (props.background)
            btnColor = tinycolor(props.background);
        else {
            if (props.className !== "RadioButton" && props.className !== "CheckBox") {
                btnColor = tinycolor("#007ad9")
            }
        }
    }
    return btnColor
}