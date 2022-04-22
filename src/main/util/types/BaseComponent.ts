import { Margins } from "../../components/layouts";
import { LoadCallBack } from "..";

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
    margins?: string|Margins,
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
}
export default BaseComponent