import { BaseRequest } from ".";

/** Interface for FetchRequest */
interface FetchRequest extends BaseRequest{
    dataProvider: string | undefined,
    columnNames?: string[],
    filter?: {columnNames?:string[], values?: any[]},
    fromRow: number | undefined,
    rowCount: number | undefined,
    includeMetaData?: boolean
}
export default FetchRequest