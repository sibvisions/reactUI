import { BaseRequest } from ".";

/** Interface for OpenScreenRequest */
interface OpenScreenRequest extends BaseRequest {
    componentId: string | undefined
}
export default OpenScreenRequest;
