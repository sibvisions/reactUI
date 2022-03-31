import { DataProviderRequest } from "..";

/** Interface for FetchRequest */
interface FetchRequest extends DataProviderRequest {
    columnNames?: string[],
    filter?: {columnNames?:string[], values?: any[]},
    fromRow: number | undefined,
    rowCount: number | undefined,
    includeMetaData?: boolean
}
export default FetchRequest