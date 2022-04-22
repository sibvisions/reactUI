import tinycolor from 'tinycolor2';
import { Margins } from '../layouts';
import { convertIcon, Dimension } from '../../util';
import { UIFont, IconProps } from '.';

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
 */
export function parseIconData(foreground:string|undefined, iconData:string|undefined): IconProps {
    if (iconData) {
        let splittedIconData:string[];
        let iconName:string;
        let iconSize:Dimension = {width: 14, height: 14};
        let iconColor:string|undefined = tinycolor(foreground).toString() || undefined;

        if (iconData.includes(";mapping=true")) {
            iconData = iconData.replace(";mapping=true", "");
        }

        if (iconData.includes("FontAwesome")) {
            splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(',');
            iconName = convertIcon(splittedIconData[0])
            iconSize = {width: parseInt(splittedIconData[1] ?? 16), height: parseInt(splittedIconData[2] ?? 16)};
            iconColor = foreground ? tinycolor(foreground).toString() : undefined;
            /** If there is a semicolon the icondata string has to be split and sliced differently */
            if (iconData.includes(';')) {
                let splittedColorIconData = iconData.slice(iconData.indexOf('.') + 1).split(';');
                splittedColorIconData.forEach((prop:string, i) => {
                    switch (i) {
                        case 0:
                            iconName = convertIcon(splittedColorIconData[0]);
                            break;
                        case 1:
                            iconColor = tinycolor(prop.substring(prop.indexOf('=')+1, prop.indexOf(','))).toString();
                            break;
                        case 2: case 3:
                            iconSize = {width: parseInt(prop ?? 16), height: parseInt(prop ?? 16)};
                            break;
                        default:
                            break;
                    }
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