/** Other imports */
import { BaseResponse } from ".";
import { IEditor } from "../components/editors";

/** Type for MetaData of dataprovider referencing other dataprovider */
export type MetaDataReference = {
    columnNames: string[],
    referencedColumnNames: string[],
    referencedDataBook: string
}

/** Interface for MetaDataResponse */
interface MetaDataResponse extends BaseResponse{
    columnView_table_: Array<string>,
    columns: Array<IEditor>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    deleteEnabled: boolean,
    insertEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean,
    masterReference?: MetaDataReference,
    detailReferences?: MetaDataReference[]
}
export default MetaDataResponse;