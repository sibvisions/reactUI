/** Interface for FetchRequest */
interface FetchRequest{
    clientId: string,
    dataProvider: string | undefined,
    columnNames?: string[],
    filter?: {columnNames?:string[], values?: any[]},
    fromRow: number | undefined,
    rowCount: number | undefined,
}
export default FetchRequest