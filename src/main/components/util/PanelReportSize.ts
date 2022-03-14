import { Dimension, LoadCallBack, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from ".";

/**
 * Reports the size of a panel to its parent. Handles special cases of the pansels
 * @param id - the id of the panel
 * @param type - the type of the panel "P" = Panel, "G" = GroupPanel, "S" = ScrollPanel
 * @param calcPref - the calcualted preferred-size
 * @param className - the classname of the component
 * @param calcMin - the calculated minimum-size
 * @param propPref - the preferred-size received from the server
 * @param propMin - the minimum-size received from the server
 * @param propMax - the maximum-size received from the server
 * @param onLoadCallback - the function to report the size to the parent
 * @param minusHeight - True, if the panel has to adjust its height to the scrollbar (only for ScrollPanels)
 * @param minusWidth - True, if the panel has to adjust its width to the scrollbar (only for ScrollPanels)
 * @param scrollSize - The layout size of a ScrollPanel
 * @param scrollCallback - The callback for a ScrollPanel
 */
export function panelReportSize(id:string, 
                                type:"P"|"S"|"G" , 
                                calcPref: Dimension,
                                className:string,
                                calcMin?:Dimension, 
                                propPref?:string, 
                                propMin?:string, 
                                propMax?:string, 
                                onLoadCallback?:LoadCallBack, 
                                minusHeight?: boolean, 
                                minusWidth?: boolean, 
                                scrollSize?:Dimension, 
                                scrollCallback?: (value: React.SetStateAction<Dimension | undefined>) => void) {
    if (onLoadCallback) {
        const adjustedSize:Dimension = { height: calcPref.height, width: calcPref.width }
        if (type === "G") {
            adjustedSize.height += 28
        }
        else if (type === "S") {
            adjustedSize.height += minusHeight ? 17 : 0
            adjustedSize.width += minusWidth ? 17 : 0
            if (scrollCallback && (scrollSize?.height !== adjustedSize.height || scrollSize.width !== adjustedSize.width)) {
                scrollCallback({height: adjustedSize.height, width: adjustedSize.width})
            }
        }
        sendOnLoadCallback(
            id,
            className,
            propPref ? parsePrefSize(propPref) : adjustedSize,
            parseMaxSize(propMax),
            calcMin ? calcMin : parseMinSize(propMin),
            undefined,
            onLoadCallback
        )
    }
}