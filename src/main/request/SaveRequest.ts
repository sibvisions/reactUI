import { DataProviderRequest } from ".";

/** Interface for SaveRequest */
interface SaveRequest extends DataProviderRequest {
    onlySelected?: boolean
}
export default SaveRequest