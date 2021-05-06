/** Other imports */
import { Size } from "./";

/**
 * Checks if the preferred size isn't to small or to big for its minimum/maximum size
 * @param prefSize - the preferred size
 * @param minSize - the minimum size
 * @param maxSize - the maximum size
 * @returns the preferred size adjusted to minimum/maximum size if necessary
 */
function checkSizes(prefSize:Size, minSize:Size|undefined, maxSize:Size|undefined):Size {
    let sizeToSend:Size = prefSize;
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

/**
 * Sends the onload callback of the component to the layout
 * @param id - the id of the component
 * @param preferredSize - the preferred size
 * @param maxSize - the maximum size
 * @param minSize - the minimum size
 * @param ref - the reference of the component
 * @param onLoadCallback - the onLoadCallback function
 */
export function sendOnLoadCallback(id: string, preferredSize:Size|undefined, maxSize: Size, minSize: Size, ref: any, onLoadCallback: Function | undefined) {
    let checkedSize:Size
    if (onLoadCallback) {
        if (preferredSize) {
            checkedSize = checkSizes(preferredSize, minSize, maxSize);
        }
        else {
            /** Measure how big the component wants to be initially */
            const prefSize:Size = {width: ref.getBoundingClientRect().width, height: ref.getBoundingClientRect().height};
            checkedSize = checkSizes(prefSize, minSize, maxSize)
        }
        onLoadCallback(id, checkedSize, minSize, maxSize);
    }
}