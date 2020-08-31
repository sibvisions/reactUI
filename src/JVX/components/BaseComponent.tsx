interface BaseComponent{
    onLoadCallback: Function | undefined
    id: number,
    parent: string | undefined
    name: string,
    className: string,
    "~remove": boolean | undefined,
    "~destroy": boolean | undefined
}
export default BaseComponent