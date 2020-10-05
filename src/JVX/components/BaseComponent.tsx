import LoadCallBack from "./util/LoadCallBack";

interface BaseComponent{
    onLoadCallback: LoadCallBack
    id: string,
    parent: string | undefined
    name: string,
    className: string,
    "~remove": boolean | undefined,
    "~destroy": boolean | undefined,
    isVisible: boolean | undefined,
    visible: boolean | undefined,
    constraints: string
    preferredSize?: string
}
export default BaseComponent