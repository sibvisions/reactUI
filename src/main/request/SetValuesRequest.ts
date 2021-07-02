import { ComponentRequest, SelectFilter, DataProviderRequest } from ".";

/** Interface for SetValuesRequest */
interface SetValuesRequest extends ComponentRequest, DataProviderRequest {
    columnNames: Array<string> | undefined,
    filter: SelectFilter | undefined,
    values: Array<any> | undefined
}
export default SetValuesRequest