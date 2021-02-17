/** 3rd Party imports */
import tinycolor from 'tinycolor2';

/** Other imports */
import Margins from '../layouts/models/Margins';
import Size from '../util/Size';
import IconProps from './IconProps';
import { UIFont } from './UIFont';

/**
 * Returns margins of component
 * @param margins - margins sent as string by server or as Margins obj
 * @returns Margins of component
 */
export function getMargins(margins:string|Margins|undefined) {
    if (margins !== undefined)
        if (typeof margins === "string")
            return new Margins(margins.split(','));
        else
            return margins;
    else
        return undefined
}

/**
 * Returns font-family, font-size and font-style of component
 * @param font - font sent by server or as UIFont obj
 * @returns font-family, font-size and font-style of component
 */
export function getFont(font:string|UIFont|undefined) {
    if (font !== undefined) {
        if (typeof font === "string")
            return new UIFont(font.split(','));
        else
            return font;
    }
    else
        return undefined;
}

/**
 * Returns split up and modified icondata to properly display an icon. Can either display FontAwesome icons or Images sent by the server.
 * @param foreground - foreground color of component
 * @param iconData - icondata of component
 * @returns split up and modified icondata to properly display an icon as obj: icon - name of FontAwesome icon or URL to server image
 * size - size of icon color - foreground color of icon
 */
export function parseIconData(foreground:string|undefined, iconData:string|undefined): IconProps {
    if (iconData) {
        let splittedIconData:string[];
        let iconName:string;
        let iconSize:Size = {width: 14, height: 14};
        let iconColor:string|undefined = tinycolor(foreground).toString() || undefined;

        if (iconData.includes("FontAwesome")) {
            splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(',');
            iconName = "fa fa-" + splittedIconData[0];
            iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
            iconColor = foreground ? tinycolor(foreground).toString() : undefined;
            /** If there is a semicolon the icondata string has to be split and sliced differently */
            if (iconData.includes(';')) {
                let splittedColorIconData = iconData.slice(iconData.indexOf('.') + 1).split(';');
                iconName = "fa fa-" + splittedColorIconData[0]
                splittedColorIconData.forEach((prop:string) => {
                    if (prop.includes("color"))
                        iconColor = tinycolor(prop.substring(prop.indexOf('=')+1, prop.indexOf(','))).toString();
                });
            }
            return {icon: iconName, size: iconSize, color: iconColor}
        }
        else {
            splittedIconData = iconData.split(',');
            iconName = splittedIconData[0];
            iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
            return {icon: iconName, size: iconSize, color: iconColor};
        }
    }
    else {
        return {icon: undefined, size: undefined, color: undefined};
    }
}