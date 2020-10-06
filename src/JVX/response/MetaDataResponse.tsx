import BaseResponse from "./BaseResponse";

interface MetaDataResponse extends BaseResponse{
    "columnView.table": Array<string>,
    columns: Array<{name: string, label:string}>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    deleteEnabled: boolean,
    insertEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean
}
export default MetaDataResponse;