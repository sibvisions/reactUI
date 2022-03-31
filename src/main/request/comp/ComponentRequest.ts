import { BaseRequest } from "..";

/** Interface for Requests with componentId */
interface ComponentRequest extends BaseRequest {
    componentId?:string;
}
export default ComponentRequest;