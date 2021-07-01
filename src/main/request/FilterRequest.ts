import FilterCondition from "../model/FilterCondition";
import { BaseRequest } from ".";


/** Interface for FilterRequest */
interface FilterRequest extends BaseRequest {
    dataProvider: string|undefined,
    editorComponentId: string|undefined,
    value: string,
    columnNames?:string[],
    filterCondition?:FilterCondition
}
export default FilterRequest