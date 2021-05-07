/** Type for selecteRecord/selectTree Filters */
export type SelectFilter = {
    columnNames: string[],
    values: any[]
}

/** Interface for SelectRowRequest */
interface SelectRowRequest {
    clientId: string,
    componentId: string | undefined,
    dataProvider: string | undefined,
    filter: SelectFilter | undefined
}
export default SelectRowRequest