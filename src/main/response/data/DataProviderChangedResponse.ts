/** Other imports */
import { BaseResponse } from "..";

/** Interface for DataProviderChangedResponse */
interface DataProviderChangedResponse extends BaseResponse{
    dataProvider: string,
    insertEnabled?: boolean,
    deleteEnabled?: boolean,
    updateEnabled?: boolean,
    readOnly?: boolean,
    reload?: -1 | 0 | 1,
    selectedRow?: number,
    treePath?: number[],
    selectedColumn?: string,
    changedValues?: any[],
    changedColumnNames?: string[],
    deletedRow?: number
}
export default DataProviderChangedResponse