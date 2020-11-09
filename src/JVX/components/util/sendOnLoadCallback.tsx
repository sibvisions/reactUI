export function sendOnLoadCallback(id:string, preferredSize:string|undefined, ref:any, onLoadCallback:Function|undefined) {
    if (onLoadCallback) {
        if (preferredSize) {
            const prefSize = preferredSize.split(',');
            const width = parseInt(prefSize[0]);
            const height = parseInt(prefSize[1]);
            onLoadCallback(id, height, width);
        }
        else {
            const size: DOMRect = ref.getBoundingClientRect();
            onLoadCallback(id, size.height, size.width);
        }
    }
}