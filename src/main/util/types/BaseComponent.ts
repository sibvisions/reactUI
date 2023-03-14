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

import Margins from "../../components/layouts/models/Margins"
import LoadCallBack from "./LoadCallBack"

/** Interface for BaseComponent every components possible properties */
interface BaseComponent {
    onLoadCallback?: LoadCallBack
    id: string,
    parent?: string,
    name: string,
    eventAction?: boolean,
    className: string,
    "~remove"?: boolean|string,
    "~destroy"?: boolean|string,
    "~additional"?: boolean,
    visible?: boolean,
    constraints: string,
    bounds?: string,
    preferredSize?: string,
    maximumSize?: string,
    minimumSize?: string,
    background?: string,
    foreground?: string,
    margins?: string,
    horizontalAlignment?: 0 | 1 | 2 | 3,
    verticalAlignment?: 0 | 1 | 2 | 3,
    font?: string,
    image?: string,
    focusable?: boolean,
    tabIndex?: number,
    style?: string,
    text?: string,
    indexOf?: number,
    eventMouseClicked?: boolean,
    eventMousePressed?: boolean,
    eventMouseReleased?: boolean,
    eventFocusGained?: boolean,
    eventFocusLost?: boolean,
    ariaLabel?: string,
    ariaPressed?: boolean,
    popupMenu?: any,
    toolTipText?: string,
    classNameEventSourceRef?:string,
    enabled?: boolean
    requestFocus?: boolean
    nameComponentRef?: string
    invalid?:boolean,
    contentParentName?:string
}
export default BaseComponent