import Size from "./Size";

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

export function sendOnLoadCallback(id: string, preferredSize: Size | undefined, maxSize: Size | undefined, minSize: Size | undefined, ref: any, onLoadCallback: Function | undefined) {
    if (onLoadCallback) {
        console.log(preferredSize, id)
        if (preferredSize) {
            const sizeToSend:Size = checkSizes(preferredSize, minSize, maxSize);
            console.log(sizeToSend.height, sizeToSend.width)
            onLoadCallback(id, sizeToSend.height, sizeToSend.width);
        }
        else {
            const prefSize:Size = {width: ref.getBoundingClientRect().width, height: ref.getBoundingClientRect().height};
            const sizeToSend:Size = checkSizes(prefSize, minSize, maxSize)
            onLoadCallback(id, sizeToSend.height, sizeToSend.width);
        }
    }
}