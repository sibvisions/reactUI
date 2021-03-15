/** Other imports */
import BaseResponse from "./BaseResponse";
import {IEditor} from "../components/editors/IEditor";

/** Type for MetaData of dataprovider referencing other dataprovider */
type MetaDataReference = {
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