import { ComponentRequest } from "..";

/** Interface for SetScreenParameter request */
interface SetScreenParameterRequest extends ComponentRequest {
    parameter?: { [key:string]: any }
}
export default SetScreenParameterRequest