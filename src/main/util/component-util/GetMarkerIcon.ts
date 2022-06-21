/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { parseIconData } from "../../components/comp-props/ComponentProperties";
import IconProps from "../../components/comp-props/IconProps";

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