interface BaseComponent{
    onLoadCallback: Function | undefined
    id: string,
    parent: string | undefined
    name: string,
    className: string,
    "~remove": boolean | undefined,
    "~destroy": boolean | undefined
}
export default BaseComponent