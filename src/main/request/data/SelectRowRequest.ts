import { ComponentRequest, DataProviderRequest } from "..";

/** Type for selecteRecord/selectTree Filters */
export type SelectFilter = {
    columnNames: string[],
    values: any[]
}

/** Interface for SelectRowRequest */
interface SelectRowRequest extends ComponentRequest, DataProviderRequest {
    filter: SelectFilter | undefined,
    selectedColumn?: string,
    rowNumber?:number
}
export default SelectRowRequest