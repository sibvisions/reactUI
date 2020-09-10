import { getMargins, getAlignments, getFont, parseIconData, getImageTextGap } from '../ComponentProperties';
import { Size } from '../../helper/Size';
import { toPx } from '../../helper/ToPx';
import tinycolor from 'tinycolor2';


export function buttonProps(props) {
    return {
        btnProps: {
            id: props.id,
            iconPos: getIconPos(props.horizontalTextPosition, props.verticalTextPosition),
            //extra check if togglebutton because of weird tabindex bug (togglebutton needs number-, splitbutton needs string value)
            tabIndex: getBtnFocusable(props.focusable) ? (props.tabIndex ? props.tabIndex : props.className === "ToggleButton" ? 0 : '0') : props.className === "ToggleButton" ? -1 : '-1',
            style: {
                display: 'flex',
                flexDirection: getBtnDirection(props.horizontalTextPosition),
                justifyContent: getBtnDirection(props.horizontalTextPosition) === 'row' ? getAlignments(props).ha : getAlignments(props).va,
                alignItems: getBtnDirection(props.horizontalTextPosition) === 'row' ? getAlignments(props).va : getAlignments(props).ha,
                background: getBtnBgdColor(props),
                color: getFgdColor(props),
                borderColor: getBtnBgdColor(props),
                paddingTop: getMargins(props).marginTop,
                paddingLeft: getMargins(props).marginLeft,
                paddingBottom: getMargins(props).marginBottom,
                paddingRight: getMargins(props).marginRight,
                fontFamily: getFont(props).fontFamily,
                fontWeight: getFont(props).fontWeight,
                fontStyle: getFont(props).fontStyle,
                fontSize: getFont(props).fontSize
            }
        },
        iconProps: parseIconData(props, props.image),
        btnImgTextGap: getImageTextGap(props),
        btnBorderPainted: getBorderPainted(props.borderPainted),
    }
}

export function styleButton(ref, btn, constraints) {
    if (btn.classList.contains("p-button-icon-only")) {
        for (let child of btn.children) {
            if (child.classList.contains("p-button-text")) {
                child.remove()
            }
        }
    }
    let size = new Size(parseInt(ref.style.width), parseInt(ref.style.height));
    btn.style.setProperty('width', isBorderConstraints(constraints) ? '100%' : toPx(size.width));
    btn.style.setProperty('height', isBorderConstraints(constraints) ? '100%' : toPx(size.height));
}

export function styleChildren(btnChildren, props, btnData) {
    if (props.className === "PopupMenuButton") {
        for (let btnChild of btnChildren) {
            if (props.layoutStyle !== undefined) {
                styleMenuButton(btnChild, props.layoutStyle, btnData.btnProps)
            }
            for (let child of btnChild.children) { 
                styleButtonContent(child, props, btnData.iconProps);
            }
        }
    }
    else {
        for (let child of btnChildren) {
            styleButtonContent(child, props, btnData.iconProps);
        }
    }
}

function styleMenuButton(btnChild, layoutStyle, btnProps) {
    btnChild.style.setProperty('height', toPx(layoutStyle.height));
    btnChild.style.setProperty('padding-top', toPx(btnProps.style.paddingTop));
    btnChild.style.setProperty('padding-left', toPx(btnProps.style.paddingLeft));
    btnChild.style.setProperty('padding-bottom', toPx(btnProps.style.paddingBottom));
    btnChild.style.setProperty('padding-right', toPx(btnProps.style.paddingRight));
    if (btnChild.classList.contains("p-splitbutton-defaultbutton")) {
        btnChild.style.setProperty('width', !(layoutStyle.width+'').includes('%') ? toPx(layoutStyle.width-38) : 'calc(100% - 38px)');
        btnChild.style.setProperty('display', btnProps.style.display);
        btnChild.style.setProperty('flex-direction', btnProps.style.flexDirection);
        btnChild.style.setProperty('justify-content', btnProps.style.justifyContent);
        btnChild.style.setProperty('align-items', btnProps.style.alignItems);
    }
    else if (btnChild.classList.contains("p-splitbutton-menubutton")) {
        btnChild.style.setProperty('width', '38px');
    }
}

function styleButtonContent(child, props, iconProps) {
    if (!child.parentElement.classList.contains("p-button-icon-only") && !child.classList.value.includes("label")) {
        if ((props.className === "RadioButton" || props.className === "CheckBox") && props.horizontalTextPosition === 1) {
            let alignment = getAlignments(props).ha
            let labelWidth = document.getElementById(props.id).querySelector("[class$=label]").offsetWidth/2;
            let childWidth = child.offsetWidth/2;
            //ha because if hTextPos = 1 ha and va get switched
            if (alignment === 'flex-start') {
                child.style.setProperty('margin-left', toPx(labelWidth-childWidth))
            }
            else if (alignment === 'flex-end') {
                child.style.setProperty('margin-right', toPx(labelWidth-childWidth))
            }
        }
        let gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);
        child.style.setProperty('margin-' + gapPos, toPx(getImageTextGap(props)));
    }
    if (iconProps) {
        if (child.classList.value.includes(iconProps.icon)) {
            child.style.setProperty('width', toPx(iconProps.size.width));
            child.style.setProperty('height', toPx(iconProps.size.height));
            child.style.setProperty('color', iconProps.color);
            if (!child.classList.value.includes('fas')) {
                child.style.setProperty('background-image', 'url(http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + iconProps.icon + ')');
            }
        }
    }
    child.style.setProperty('padding', 0);
}

export function addHoverEffect(obj, color, checkedColor, dark, props, borderPainted, checked) {
    if (borderPainted) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', tinycolor(color.getOriginalInput()).darken(dark));
            obj.style.setProperty('border-color', tinycolor(color.getOriginalInput()).darken(dark));
        }
        obj.onmouseout = () => {
            if (checked) {
                obj.style.setProperty('background', checkedColor);
                obj.style.setProperty('border-color', checkedColor);
            }
            else {
                obj.style.setProperty('background', color.getOriginalInput());
                obj.style.setProperty('border-color', color.getOriginalInput());
            }
        }
    }
    else if (props.borderOnMouseEntered) {
        obj.onmouseover = () => {
            obj.style.setProperty('background', props.background !== undefined ? props.background : "#007ad9")
            obj.style.setProperty('border-color', props.background !== undefined ? props.background : "#007ad9")
        }
        obj.onmouseout = () => {
            if (checked) {
                obj.style.setProperty('background', checkedColor)
                obj.style.setProperty('border-color', checkedColor)
            }
            else {
                obj.style.setProperty('background', color.getOriginalInput())
                obj.style.setProperty('border-color', color.getOriginalInput())
            }
        }
    }
}

function isBorderConstraints(constraints) {
    if (constraints === 'North' || constraints === 'West' || constraints === 'Center' ||
        constraints === 'East' || constraints === 'South') {
        return true;
    }
    else {
        return false;
    }
}

function getGapPos(hTextPos, vTextPos) {
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

function getBtnBgdColor(props) {
    if (props.borderPainted === undefined || props.borderPainted === true) {
        if (props.background) {
            return tinycolor(props.background);
        }
        else {
            if (props.className === "RadioButton" || props.className === "CheckBox") {
                return tinycolor(document.getElementById(props.parent).style.background)
            }
            else {
                return tinycolor("#007ad9")
            }
        }
    }
    else {
        return tinycolor(document.getElementById(props.parent).style.background);
    }
}

function getFgdColor(props) {
    if (props.foreground) {
        return tinycolor(props.foreground);
    }
    else {
        if (props.className === "RadioButton" || props.className === "CheckBox") {
            return tinycolor('black')
        }
        else {
            return tinycolor('white')
        }
    }
}

function getBtnDirection(hTextPos) {
    if (hTextPos === 1) {
        return 'column';
    }
    else {
        return 'row';
    }
}

function getIconPos(hTextPos, vTextPos) {
    if (hTextPos === 0 || (hTextPos === 1 && vTextPos === 0)) {
        return "right";
    }
    else {
        return "left";
    }
}

function getBorderPainted(borderPainted) {
    if (borderPainted === undefined || borderPainted === true) {
        return true;
    }
    else {
        return false;
    }
}

function getBtnFocusable(focusable) {
    if (focusable === undefined || focusable === true) {
        return true;
    }
    else {
        return false;
    }
}