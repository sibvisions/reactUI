import BaseResponse from "./BaseResponse";

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