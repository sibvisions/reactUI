/** Other imports */
import { BaseResponse } from ".";
import { SortDefinition } from "../request";

/** Interface for FetchResponse */
interface FetchResponse extends BaseResponse{
    columnNames: Array<string>;
    records: Array<Array<any>>;
    dataProvider: string;
    isAllFetched: boolean;
    selectedRow: number;
    from: number;
    to: number;
    treePath?: number[];
    selectedColumn?: string;
    sortDefinition?: SortDefinition[]
}
export default FetchResponse