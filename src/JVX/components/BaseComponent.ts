/** Other imports */
import { UIFont } from "./compprops/UIFont";
import Margins from "./layouts/models/Margins";
import LoadCallBack from "./util/LoadCallBack";

/** Interface for BaseComponent every components possible properties */
interface BaseComponent{
    onLoadCallback?: LoadCallBack
    id: string,
    parent?: string
    name: string,
    className?: string,
    "~remove"?: boolean
    "~destroy"?: boolean
    visible?: boolean
    constraints: string
    bounds?: string
    preferredSize?: string
    maximumSize?: string
    minimumSize?: string
    background?: string
    foreground?: string
    margins?: string|Margins
    horizontalAlignment?: 0 | 1 | 2| 3
    verticalAlignment?: 0 | 1 | 2| 3
    font?: string|UIFont
    image?: string
    focusable?: boolean
    tabIndex?: number
    style?: string
    text?: string
    indexOf?: number;
}
export default BaseComponent