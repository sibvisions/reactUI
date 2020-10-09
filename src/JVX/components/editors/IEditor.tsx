import BaseComponent from "../BaseComponent";

export interface ICellEditor{
    className: string,
    horizontalAlignment: 0 | 1 | 2| 3,
    verticalAlignment: 0 | 1 | 2| 3,
    directCellEditor?: boolean
}

export interface IEditor extends BaseComponent{
    cellEditor?: ICellEditor,
    "cellEditor.editable":boolean,
    "cellEditor.horizontalAlignment"?: 0 | 1 | 2| 3,
    "cellEditor.verticalAlignment"?: 0 | 1 | 2| 3,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    enabled: boolean,
    columnName: string,
    dataRow: string,
    eventFocusedGain?: boolean,
    text?:string
    onSubmit?: Function

}