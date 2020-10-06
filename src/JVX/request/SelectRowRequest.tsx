interface SelectRowRequest {
    clientId: string,
    componentId: string | undefined,
    dataProvider: string | undefined,
    filter: {
        columnNames: Array<string>,
        values: Array<string>
    } | undefined,
}
export default SelectRowRequest