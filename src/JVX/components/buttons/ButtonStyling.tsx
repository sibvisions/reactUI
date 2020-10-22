import { CSSProperties } from 'react';
import tinycolor from 'tinycolor2';
import BaseComponent from '../BaseComponent';
import { checkAlignments } from "../compprops/CheckAlignments";
import { getFont, getMargins, parseIconData } from '../compprops/ComponentProperties';
import Size from '../util/Size';
import { IButton } from "./IButton";

export function buttonProps(props:IButton): {iconPos:string, tabIndex:number|string, style:CSSProperties, iconProps:{icon:string|undefined, size:Size|undefined, color:string|undefined}, btnImgTextGap:number, btnBorderPainted:boolean} {
    const margins = getMargins(props);
    const font = getFont(props);
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

export function styleButton(btn:HTMLElement, props:IButton) {
    if (btn.classList.contains("p-button-icon-only")) {
        for (let child of btn.children) {
            if (child.classList.contains("p-button-text"))
                child.remove();
        }
    }
    if (props.style && props.style.includes("hyperlink"))
        btn.classList.add("hyperlink");
}

function styleMenuButton(btnChild:HTMLElement, layoutStyle:React.CSSProperties, btnProps:any) {
    btnChild.style.setProperty('height', layoutStyle.height+'px');
    btnChild.style.setProperty('padding-top', btnProps.style.paddingTop+'px');
    btnChild.style.setProperty('padding-left', btnProps.style.paddingLeft+'px');
    btnChild.style.setProperty('padding-bottom', btnProps.style.paddingBottom+'px');
    btnChild.style.setProperty('padding-right', btnProps.style.paddingRight+'px');
    btnChild.style.setProperty('border-color', btnProps.style.backgroundColor);
    btnChild.style.setProperty('color', btnProps.style.color);
    if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
        //@ts-ignore
        btnChild.style.setProperty('width', !(layoutStyle.width+'').includes('%') ? (layoutStyle.width-38)+'px' : 'calc(100% - 38px)');
        btnChild.style.setProperty('display', btnProps.style.display);
        btnChild.style.setProperty('flex-direction', btnProps.style.flexDirection);
        btnChild.style.setProperty('justify-content', btnProps.style.justifyContent);
        btnChild.style.setProperty('align-items', btnProps.style.alignItems);  
    }
    else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
        btnChild.style.setProperty('width', '38px');
    }
}

function styleButtonContent(child:HTMLElement, props:IButton, iconProps:any) {
    if (child.parentElement !== null) {
        if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
            //if the button is a Radiobutton or a Checkbox and the hTextPos is 1, the Radiobutton/Checkbox gets moved to the center of the component
            if ((props.className === "RadioButton" || props.className === "CheckBox") && props.horizontalTextPosition === 1) {
                let alignment = checkAlignments(props)?.ha
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
            let gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);
            child.style.setProperty('margin-' + gapPos, (props.imageTextGap ? props.imageTextGap : 4)+'px');
        }
        if (iconProps) {
            if (child.classList.value.includes(iconProps.icon)) {
                child.style.setProperty('width', iconProps.size.width+'px');
                child.style.setProperty('height', iconProps.size.height+'px');
                child.style.setProperty('font-size', iconProps.size.height+'px');
                child.style.setProperty('color', iconProps.color);
                if (!child.classList.value.includes('fa')) {
                    child.style.setProperty('background-image', 'url(http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + iconProps.icon + ')');
                }
            }
        }
        child.style.setProperty('padding', 0+'px');
    }
}

export function styleChildren(btnChildren:HTMLCollection, props:IButton, btnData:any, layoutStyle:React.CSSProperties|undefined) {
    if (props.className === "PopupMenuButton") {
        for (let btnChild of btnChildren) {
            if (layoutStyle !== undefined)
                styleMenuButton(btnChild as HTMLElement, layoutStyle, btnData);
            for (let child of btnChild.children)
                styleButtonContent(child as HTMLElement, props, btnData.iconProps);
        }
    }
    else {
        for (let child of btnChildren) {
            styleButtonContent(child as HTMLElement, props, btnData.iconProps)
        }
    }
}

export function addHoverEffect(obj:HTMLElement, color:string|undefined, checkedColor:string|null, dark: number, props:IButton, borderPainted:boolean, checked:boolean|undefined) {
    if (borderPainted) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', tinycolor(color).darken(dark).toString());
            obj.style.setProperty('border-color', tinycolor(color).darken(dark).toString());
        }
        obj.onmouseout = () => {
            if (checked && checkedColor !== null) {
                obj.style.setProperty('background', checkedColor.toString());
                obj.style.setProperty('border-color', checkedColor.toString());
            }
            else {
                obj.style.setProperty('background', color ? color : null);
                obj.style.setProperty('border-color', color ? color : null);
            }
        }
    }
    else if (props.borderOnMouseEntered) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', props.background !== undefined ? props.background : "#007ad9")
            obj.style.setProperty('border-color', props.background !== undefined ? props.background : "#007ad9")
        }
        obj.onmouseout = () => {
            if (checked && checkedColor !== null) {
                obj.style.setProperty('background', checkedColor.toString())
                obj.style.setProperty('border-color', checkedColor.toString())
            }
            else {
                obj.style.setProperty('background', color ? color : null)
                obj.style.setProperty('border-color', color ? color : null)
            }
        }
    }
}

function getBtnBgdColor(props:IButton) {
    let btnColor = tinycolor('grey'); 
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