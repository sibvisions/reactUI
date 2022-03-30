/** Other imports */
import { BaseResponse } from ".";
import { ICellEditorCheckBox, 
         ICellEditorChoice, 
         ICellEditorDate, 
         ICellEditorImage, 
         ICellEditorLinked, 
         ICellEditorNumber } from "../components/editors"

/** Type for MetaData of dataprovider referencing other dataprovider */
export type MetaDataReference = {
    columnNames: string[],
    referencedColumnNames: string[],
    referencedDataBook: string
}

export interface ColumnDescription {
    name:string,
    label: string,
    cellEditor: ICellEditorCheckBox|
                ICellEditorChoice|
                ICellEditorDate|
                ICellEditorImage|
                ICellEditorLinked|
                ICellEditorNumber,
    dataTypeIdentifyer: number,
    width: number,
    readonly: boolean,
    nullable: boolean,
    resizable: boolean,
    sortable: boolean,
    movable: boolean
}

export interface LengthBasedColumnDescription extends ColumnDescription {
    length: number
}

export interface NumericColumnDescription extends LengthBasedColumnDescription {
    precision: number,
    scale: number,
    signed: boolean
}

/** Interface for MetaDataResponse */
interface MetaDataResponse extends BaseResponse {
    columnView_table_: Array<string>,
    columns: Array<LengthBasedColumnDescription|NumericColumnDescription>,
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