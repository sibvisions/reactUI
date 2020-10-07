interface FetchRequest{
    clientId: string,
    dataProvider: string | undefined,

    fromRow: number | undefined,
    rowCount: number | undefined,
}
export default FetchRequest