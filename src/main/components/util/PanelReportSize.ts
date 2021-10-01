import { Dimension, LoadCallBack, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from ".";

export function panelReportSize(id:string, 
                                type:"P"|"S"|"G" , 
                                calcPref: Dimension, 
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
            propPref ? parsePrefSize(propPref) : adjustedSize,
            parseMaxSize(propMax),
            calcMin ? calcMin : parseMinSize(propMin),
            undefined,
            onLoadCallback
        )
    }
}