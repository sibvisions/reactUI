import { BaseRequest } from ".";

/** Interface for SetValueRequest */
interface SetValueRequest extends BaseRequest{
    componentId?: string
    value?: any
}
export default SetValueRequest