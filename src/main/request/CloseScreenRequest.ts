import { ComponentRequest } from ".";

/** Interface for CloseScreenRequest */
interface CloseScreenRequest extends ComponentRequest {
    parameter?: { [key:string]:any }
}
export default CloseScreenRequest;