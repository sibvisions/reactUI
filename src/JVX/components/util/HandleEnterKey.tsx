export function handleEnterKey(event:any, sendSetValues:Function) {
    if (event.key === "Enter") {
        sendSetValues();
    }
}