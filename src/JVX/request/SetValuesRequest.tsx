interface SetValuesRequest{
    clientId: string | undefined,
    componentId: string | undefined,
    dataProvider: string | undefined,
    columnNames: Array<string> | undefined,
    values: Array<string> | undefined
}
export default SetValuesRequest