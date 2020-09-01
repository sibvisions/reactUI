import tinycolor from 'tinycolor2';
import { Margins } from '../layouts/layoutObj/Margins';
import { mapFlex, checkAlignments } from '../helper/CheckAlignments';
import { UIFont } from '../helper/UIFont';
import { Size } from '../helper/Size';

export function getPanelBgdColor(props, con) {
    if (document.getElementById(props.id) !== null) {
        if (props.background) {
            return tinycolor(props.background);
        }
        else {
            //first panel w/o parent
            if (con.contentStore.flatContent.find(elem => elem.id === props.parent) === undefined) {
                return tinycolor(document.getElementById(props.id).parentElement.style.backgroundColor);
            }
            //parent panel
            else {
                return tinycolor(document.getElementById(props.parent).style.background);
            }
        }
    }
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
    if (props.className.includes("Button") || props.className === "Label") {
        return mapFlex(checkAlignments(props))
    }
    else {
        return checkAlignments(props)
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
                iconName = "fas fa-" + splittedIconData[0];
                iconSize = new Size(splittedIconData[1], splittedIconData[2]);
                iconColor = props.foreground !== undefined ? tinycolor(props.foreground) : tinycolor('white');
                return {icon: iconName, size: iconSize, color: iconColor};
            }
            else {
                splittedIconData = iconString.split(';');
                iconName = "fas fa-" + splittedIconData[0];
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
                    iconColor = props.foreground !== undefined ? tinycolor(props.foreground) : tinycolor('white');
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