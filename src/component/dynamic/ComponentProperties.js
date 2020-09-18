import tinycolor from 'tinycolor2';
import { Margins } from '../layouts/layoutObj/Margins';
import { mapFlex, checkAlignments, checkCellEditorAlignments } from '../helper/CheckAlignments';
import { UIFont } from '../helper/UIFont';
import { Size } from '../helper/Size';

export function getPanelBgdColor(props, con) {
    let bgdColor
    if (props.background) {
        bgdColor = tinycolor(props.background);
    }
    else {
        let parent = con.contentStore.flatContent.find(elem => elem.id === props.parent);
        if (parent !== undefined && parent.background !== undefined) {
            bgdColor = parent.background
        }
        else {
            bgdColor = tinycolor('#C8C8C8')
        }
        // //first panel w/o parent
        // if (con.contentStore.flatContent.find(elem => elem.id === props.parent) === undefined) {
        //     bgdColor = tinycolor(document.getElementById(props.id).parentElement.style.backgroundColor);
        // }
        // //parent panel
        // else {
        //     if (document.getElementById(props.parent)) {
        //         bgdColor = tinycolor(document.getElementById(props.parent).style.background);
        //     }
        // }
    }
    if (!bgdColor) bgdColor = tinycolor('#C8C8C8')
    return bgdColor;
}

export function getMargins(props) {
    if (props.margins) {
        return new Margins(props.margins.split(','));
    }
    else {
        if (props.className.includes("Button") && props.className !== "RadioButton") {
            return new Margins([5, 10, 5, 10]);
        }
        else {
            return new Margins([0, 0, 0, 0]);
        }
    }
}

export function getAlignments(props) {
    if (props.className === "Editor") {
        return mapFlex(checkCellEditorAlignments(props))
    }
    else {
        return mapFlex(checkAlignments(props))
    }
}

export function getFont(props) {
    if (props.font) {
        return new UIFont(props.font.split(','));
    }
    else {
        return new UIFont([null, null, null]);
    }
}

export function getImageTextGap(props) {
    if (props.imageTextGap) {
        return props.imageTextGap;
    }
    else {
        return 4;
    }
}

export function parseIconData(props, iconData) {
    if (iconData !== undefined && iconData !== null) {
        let splittedIconData;
        let iconName;
        let iconSize;
        let iconColor;
        if (iconData.includes("FontAwesome")) {
            let iconString = iconData.slice(iconData.indexOf('.') + 1);
            let index = iconData.indexOf(';');
            if (index < 0) {
                splittedIconData = iconString.split(',');
                iconName = "fa fa-" + splittedIconData[0];
                iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                iconColor = props.foreground !== undefined ? tinycolor(props.foreground) : tinycolor('white');
                return {icon: iconName, size: iconSize, color: iconColor};
            }
            else {
                splittedIconData = iconString.split(';');
                iconName = "fa fa-" + splittedIconData[0];
                splittedIconData.splice(splittedIconData, 1)
                let sizeFound = false;
                let colorFound = false;
                splittedIconData.forEach(prop => {
                    if (prop.indexOf("size") >= 0) {
                        iconSize = new Size(prop.substring(prop.indexOf('=')+1), prop.substring(prop.indexOf('=')+1));
                        sizeFound = true;
                    }
                    else if (prop.indexOf("color") >= 0) {
                        iconColor = prop.substring(prop.indexOf('=')+1, prop.indexOf(','));
                        colorFound = true;
                    }
                });
                if (!sizeFound) {
                    iconSize = new Size(iconString[1], iconString[2]);
                }
                if (!colorFound) {
                    iconColor = props.foreground !== undefined ? tinycolor(props.foreground) : tinycolor('black');
                }
                return {icon: iconName, size: iconSize, color: iconColor};
            }
        }
        else {
            splittedIconData = iconData.split(',');
            iconName = splittedIconData[0];
            iconSize = new Size(splittedIconData[1], splittedIconData[2]);
            iconColor = null;
            return { icon: iconName, size: iconSize, color: iconColor };
        }
    }
    else {
        return {icon: null, size: null, color: null}
    }
}