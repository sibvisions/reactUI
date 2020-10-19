import { sendSetValues } from "./SendSetValues";

export function handleEnterKey(event:React.KeyboardEvent<HTMLInputElement>, sendSetValues:Function) {
    if (event.key === "Enter") {
        sendSetValues();
    }
}