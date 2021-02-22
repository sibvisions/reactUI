/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for FetchResponse */
interface FetchResponse extends BaseResponse{
    columnNames: Array<string>;
    records: Array<Array<any>>;
    dataProvider: string;
    isAllFetched: boolean;
    selectedRow: number;
    from: number;
    to: number;
}
export default FetchResponse