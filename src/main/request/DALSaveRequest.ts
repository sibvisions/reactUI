import { DataProviderRequest } from ".";

/** Interface for SaveRequest */
interface DALSaveRequest extends DataProviderRequest {
    onlySelected?: boolean
}
export default DALSaveRequest