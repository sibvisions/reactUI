/** Other imports */
import BaseResponse from "./BaseResponse";
import {IEditor} from "../components/editors/IEditor";

/** Interface for MetaDataResponse */
interface MetaDataResponse extends BaseResponse{
    "columnView.table": Array<string>,
    columns: Array<IEditor>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    deleteEnabled: boolean,
    insertEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean
}
export default MetaDataResponse;