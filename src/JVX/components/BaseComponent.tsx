import LoadCallBack from "./util/LoadCallBack";

interface BaseComponent{
    onLoadCallback?: LoadCallBack
    id: string,
    parent?: string
    name: string,
    className: string,
    "~remove"?: boolean
    "~destroy"?: boolean
    visible?: boolean
    constraints: string
    preferredSize?: string
}
export default BaseComponent