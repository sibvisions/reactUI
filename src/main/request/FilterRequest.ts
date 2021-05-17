import FilterCondition from "../model/FilterCondition";


/** Interface for FilterRequest */
interface FilterRequest {
    clientId: string,
    dataProvider: string|undefined,
    
    editorComponentId: string|undefined,
    value: string,
    columnNames?:string[],
    filterCondition?:FilterCondition
}
export default FilterRequest