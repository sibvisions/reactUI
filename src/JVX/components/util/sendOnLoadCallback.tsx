import Size from "./Size";

export function sendOnLoadCallback(id:string, preferredSize:Size|undefined, maxSize:Size|undefined, minSize:Size|undefined, ref:any, onLoadCallback:Function|undefined) {
    if (onLoadCallback) {
        if (preferredSize) {
            onLoadCallback(id, preferredSize.height, preferredSize.width);
        }
        else {
            const size: DOMRect = ref.getBoundingClientRect();
            onLoadCallback(id, size.height, size.width);
        }
    }
}