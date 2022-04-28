/** Other imports */
import { BaseResponse } from "..";

export type IChangedColumns = {
    name: string
    label?: string
    readonly?: boolean
    movable?: boolean
    sortable?: boolean
}

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
    changedColumns?: IChangedColumns[]
    deletedRow?: number
}
export default DataProviderChangedResponse