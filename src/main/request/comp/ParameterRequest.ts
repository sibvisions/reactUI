import { ComponentRequest } from "..";

/** Interface for OpenScreenRequest */
interface ParameterRequest extends ComponentRequest {
    parameter?: { [key:string]: any }
}
export default ParameterRequest;