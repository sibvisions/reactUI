import { getFocusComponent } from "./GetFocusComponent";

/**
 * When enter is pressed call the given setValues function to send new values to the server
 * @param event - keyboardevent
 * @param sendSetValues - function to send values to the server
 */
export function handleEnterKey(event:any, elem:any, id:string, stopEditing?:Function) {
    if (event.key === "Enter") {
        elem.blur();
        if (stopEditing) {
            stopEditing(event)
        }
        else {
            if (event.shiftKey) {
                getFocusComponent(id, false);
            }
            else {
                getFocusComponent(id, true)
            }
        }
    }
}