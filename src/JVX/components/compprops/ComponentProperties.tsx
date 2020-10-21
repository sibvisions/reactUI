import tinycolor from 'tinycolor2';
import BaseComponent from '../BaseComponent';
import {IEditor} from "../editors/IEditor";
import Margins from '../layouts/models/Margins';
import { Panel } from '../panels/panel/UIPanel';
import Size from '../util/Size';
import { checkCellEditorAlignments } from './CheckAlignments';
import { UIFont } from './UIFont';

export function  getPanelBgdColor(props:Panel, context:any) {
    let bgdColor = tinycolor('#C8C8C8');

    if (props.background)
        bgdColor = tinycolor(props.background);
    else {
        const parent:BaseComponent = context.contentStore.flatContent.find((elem:BaseComponent) => elem.id === props.parent);
        if (parent !== undefined && parent.background)
            bgdColor = tinycolor(parent.background)
    }
    return bgdColor
}

export function getMargins(props:BaseComponent) {
    if (props.margins)
        return new Margins(props.margins.split(','));
    else {
        if (props.className.includes("Button") && props.className !== "RadioButton")
            return new Margins(['5', '10', '5', '10']);
        else
            return new Margins(['0', '0', '0', '0']);
    }
}

export function getFont(props:BaseComponent) {
    if (props.font)
        return new UIFont(props.font.split(','));
    else
        return new UIFont(["Segoe UI", "normal", "normal", "16"])
}

export function parseIconData(props:BaseComponent, iconData:string|undefined) {
    if (iconData) {
        let splittedIconData:string[];
        let iconName:string;
        let iconSize:Size = {width: 14, height: 14};
        let iconColor:tinycolor.Instance = tinycolor('white');

        if (iconData.includes("FontAwesome")) {
            if (!iconData.includes(';')) {
                splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(',');

                iconName = "fa fa-" + splittedIconData[0];
                iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
                iconColor = props.foreground ? tinycolor(props.foreground) : tinycolor('white');

                return {icon: iconName, size: iconSize, color: iconColor.toString()};
            }
            else {
                splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(';');

                iconName = "fa fa-" + splittedIconData[0];
                let sizeFound = false;
                let colorFound = false;

                splittedIconData.forEach((prop:string) => {
                    if (prop.includes("size")) {
                        iconSize = {width: parseInt(prop.substring(prop.indexOf('=')+1)), height: parseInt(prop.substring(prop.indexOf('=')+1))};
                        sizeFound = true;
                    }
                    else if (prop.includes("color")) {
                        iconColor = tinycolor(prop.substring(prop.indexOf('=')+1, prop.indexOf(',')));
                        colorFound = true;
                    }
                });

                if (!sizeFound)
                    iconSize = {width: parseInt(iconData.slice(iconData.indexOf('.') + 1)[1]), height: parseInt(iconData.slice(iconData.indexOf('.') + 1)[2])}
                if (!colorFound)
                    iconColor = props.foreground ? tinycolor(props.foreground) : tinycolor('white');
                return {icon: iconName, size: iconSize, color: iconColor.toString()}
            }
        }
        else {
            splittedIconData = iconData.split(',');
            iconName = splittedIconData[0];
            iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
            return { icon: iconName, size: iconSize, color: iconColor.toString()};
        }
    }
    else {
        return {icon: undefined, size: undefined, color: undefined};
    }
}