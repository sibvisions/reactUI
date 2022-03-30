import { BaseRequest } from "..";

/** Interface for Requests with componentId */
interface DataProviderRequest extends BaseRequest {
    dataProvider?:string|string[];
}
export default DataProviderRequest;