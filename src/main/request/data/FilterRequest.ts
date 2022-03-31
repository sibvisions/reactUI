import FilterCondition from "../../model/FilterCondition";
import { DataProviderRequest } from "..";


/** Interface for FilterRequest */
interface FilterRequest extends DataProviderRequest {
    editorComponentId: string|undefined,
    value: string,
    columnNames?:string[],
    filterCondition?:FilterCondition
}
export default FilterRequest