/** Other imports */
import { parseIconData } from "../compprops/ComponentProperties";
import IconProps from "../compprops/IconProps";

/**
 * Returns the icon of the marker
 * @param point - the point/marker
 * @param imgColName - the potentially set column name for the icon
 * @param marker - the icon data
 * @returns the icon of the marker
 */
export function getMarkerIcon(point:any, imgColName:string|undefined, marker:string|undefined):string|IconProps {
    // First set icon to standard
    let iconData:string|IconProps = "/com/sibvisions/rad/ui/swing/ext/images/map_defaultmarker.png";
    if (imgColName && point[imgColName])
        iconData = point[imgColName];
    // If there is no custom column name set use the default one
    else if (point.MARKER_IMAGE)
        iconData = point.MARKER_IMAGE;
    // Lastly if there is other icon data set use it
    else if (marker)
        iconData = parseIconData(undefined, marker);
    return iconData
}