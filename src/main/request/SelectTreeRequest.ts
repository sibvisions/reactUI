import { SelectFilter } from ".";
import { BaseRequest } from ".";

/** Interface for SelectTreeRequest */
interface SelectTreeRequest extends BaseRequest {
    componentId: string | undefined,
    dataProvider: string[] | undefined,
    filter: Array<SelectFilter|null> | undefined
}
export default SelectTreeRequest