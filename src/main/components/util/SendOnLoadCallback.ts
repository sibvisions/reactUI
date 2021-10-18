/** Other imports */
import { Dimension } from ".";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { CELLEDITOR_CLASSNAMES } from "../editors";

/**
 * Checks if the preferred size isn't to small or to big for its minimum/maximum size
 * @param prefSize - the preferred size
 * @param minSize - the minimum size
 * @param maxSize - the maximum size
 * @returns the preferred size adjusted to minimum/maximum size if necessary
 */
function checkSizes(prefSize:Dimension, minSize:Dimension|undefined, maxSize:Dimension|undefined):Dimension {
    let sizeToSend:Dimension = prefSize;
    if (minSize) {
        if (prefSize.width < minSize.width)
            sizeToSend.width = minSize.width;
        if (prefSize.height < minSize.height)
            sizeToSend.height = minSize.height;
    }
    if (maxSize) {
        if (maxSize.width < prefSize.width)
            sizeToSend.width = maxSize.width;
        if (maxSize.height < prefSize.height)
            sizeToSend.height = maxSize.height
    }
    return sizeToSend
}

function measurePrefWidth(ref:any, className:string) {
    const arrString:string[] = [COMPONENT_CLASSNAMES.TEXTAREA, COMPONENT_CLASSNAMES.TEXTFIELD, COMPONENT_CLASSNAMES.PASSWORD, CELLEDITOR_CLASSNAMES.TEXT] as string[]
    if (arrString.indexOf(className) !== -1) {
        return Math.max(ref.offsetWidth, Math.ceil(ref.getBoundingClientRect().width))
    }
    else {
        return Math.max(ref.offsetWidth, ref.scrollWidth, Math.ceil(ref.getBoundingClientRect().width))
    }
}

/**
 * Sends the onload callback of the component to the layout
 * @param id - the id of the component
 * @param preferredSize - the preferred size
 * @param maxSize - the maximum size
 * @param minSize - the minimum size
 * @param ref - the reference of the component
 * @param onLoadCallback - the onLoadCallback function
 */
export function sendOnLoadCallback(id: string, className:string, preferredSize:Dimension|undefined, maxSize: Dimension|undefined, minSize: Dimension|undefined, ref: any, onLoadCallback: Function | undefined) {
    let checkedSize:Dimension
    if (onLoadCallback) {
        if (preferredSize) {
            checkedSize = checkSizes(preferredSize, minSize, maxSize);
        }
        else {
            /** Measure how big the component wants to be initially */
            const prefSize:Dimension = {width: measurePrefWidth(ref, className), height: Math.max(ref.offsetHeight, Math.ceil(ref.getBoundingClientRect().height))};
            checkedSize = checkSizes(prefSize, minSize, maxSize);
        }
        onLoadCallback(id, checkedSize, minSize, maxSize);
    }
}