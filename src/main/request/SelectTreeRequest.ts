import { ComponentRequest, SelectFilter, DataProviderRequest } from ".";

/** Interface for SelectTreeRequest */
interface SelectTreeRequest extends ComponentRequest, DataProviderRequest {
    filter: Array<SelectFilter|null> | undefined
}
export default SelectTreeRequest