import { parseIconData } from "../../compprops/ComponentProperties";
import IconProps from "../../compprops/IconProps";

export function getMarkerIcon(point:any, imgColName:string|undefined, marker:string|undefined):string|IconProps {
    let iconData:string|IconProps = "/com/sibvisions/rad/ui/swing/ext/images/map_defaultmarker.png";
    if (imgColName && point[imgColName])
        iconData = point[imgColName];
    else if (point.MARKER_IMAGE)
        iconData = point.MARKER_IMAGE;
    else if (marker)
        iconData = parseIconData(undefined, marker);
    return iconData
}