import { BaseRequest } from ".";

/** Interface for TabRequest */
interface TabRequest extends BaseRequest {
    componentId?: string,
    index?: number,
}
export default TabRequest