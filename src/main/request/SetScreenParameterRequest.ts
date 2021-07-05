import { ComponentRequest } from ".";

/** Interface for SetScreenParameter request */
interface SetScreenParameterRequest extends ComponentRequest {
    parameter?: Map<string, any>
}
export default SetScreenParameterRequest