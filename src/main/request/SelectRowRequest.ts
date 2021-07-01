import { BaseRequest } from ".";

/** Type for selecteRecord/selectTree Filters */
export type SelectFilter = {
    columnNames: string[],
    values: any[]
}

/** Interface for SelectRowRequest */
interface SelectRowRequest extends BaseRequest {
    componentId: string | undefined,
    dataProvider: string | undefined,
    filter: SelectFilter | undefined,
    selectedColumn?: string
}
export default SelectRowRequest