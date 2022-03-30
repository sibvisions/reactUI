export function getTabIndex(focusable:boolean|undefined, tabIndex:number|undefined): number|undefined {
    return focusable !== false ? tabIndex : -1
}