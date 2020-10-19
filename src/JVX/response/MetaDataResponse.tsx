import BaseResponse from "./BaseResponse";

interface MetaDataResponse extends BaseResponse{
    "columnView.table": Array<string>,
    columns: Array<any>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    deleteEnabled: boolean,
    insertEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean
}
export default MetaDataResponse;