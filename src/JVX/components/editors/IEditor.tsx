import BaseComponent from "../BaseComponent";
import {CSSProperties} from "react";

export interface ICellEditor{
    className: string,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    directCellEditor?: boolean
}

export interface IEditor extends BaseComponent{
    cellEditor?: ICellEditor,
    cellEditor_editable_:boolean,
    cellEditor_horizontalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_verticalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_background_?:string,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    enabled: boolean,
    columnName: string,
    dataRow: string,
    eventFocusedGain?: boolean,
    text?:string
    onSubmit?: Function
    style?: CSSProperties

}