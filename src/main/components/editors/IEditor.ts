import { CSSProperties } from "react";
import BaseComponent from "../../util/types/BaseComponent";

/** Interface for cellEditor property of CellEditors */
export interface ICellEditor{
    className: string,
    contentType?: string,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    directCellEditor?: boolean,
    preferredEditorMode?: number
    autoOpenPopup?: boolean
}

/** Base Interface for CellEditors */
export interface IEditor extends BaseComponent{
    cellEditor?: ICellEditor,
    cellEditor_editable_:boolean,
    cellEditor_horizontalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_verticalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_background_?:string,
    cellEditor_foreground_?:string
    cellEditor_font_?:string
    cellEditor_placeholder_?:string
    columnName: string,
    dataRow: string,
    text:string,
    autoFocus?: boolean,
    nullable?: boolean,
    readonly?: boolean,
}