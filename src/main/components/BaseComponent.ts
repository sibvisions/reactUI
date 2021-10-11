/** Other imports */
import { UIFont } from "./compprops";
import { Margins } from "./layouts";
import { LoadCallBack } from "./util";

/** Interface for BaseComponent every components possible properties */
interface BaseComponent {
    onLoadCallback?: LoadCallBack
    id: string,
    parent?: string,
    name: string,
    className: string,
    "~remove"?: boolean,
    "~destroy"?: boolean,
    "~additional"?: boolean,
    visible?: boolean,
    constraints: string,
    bounds?: string,
    preferredSize?: string,
    maximumSize?: string,
    minimumSize?: string,
    background?: string,
    foreground?: string,
    margins?: string|Margins,
    horizontalAlignment?: 0 | 1 | 2 | 3,
    verticalAlignment?: 0 | 1 | 2 | 3,
    font?: string|UIFont,
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
    ariaLabel?:string,
    ariaPressed?:boolean,
    popupMenu?: any,
    toolTipText?:string,
    classNameEventSourceRef?:string
}
export default BaseComponent