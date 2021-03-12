/** Interface for SelectRowRequest */
interface SelectRowRequest {
    clientId: string,
    componentId: string | undefined,
    dataProvider: string | undefined,
    filter: {
        columnNames: Array<string>,
        values: Array<any>
    } | undefined,
}
export default SelectRowRequest