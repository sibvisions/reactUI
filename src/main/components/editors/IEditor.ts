import { CSSProperties } from "react";
import { AppContextType } from "../../AppProvider";
import { SelectFilter } from "../../request";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
import BaseComponent from "../BaseComponent";
import { TopBarContextType } from "../topbar/TopBar";

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
    editorStyle?: CSSProperties,
    autoFocus?: boolean,
    nullable?: boolean,
    readonly?: boolean,
    stopCellEditing?: Function,
    clicked?: boolean,
    passedKey?: string,
    rowIndex?: Function,
    filter?: Function
    isCellEditor: boolean,
    cellScreenName: string,
    context: AppContextType,
    topbar: TopBarContextType,
    layoutStyle?: CSSProperties,
    translation?: Map<string, string>
    screenName:string,
    columnMetaData: NumericColumnDescription|LengthBasedColumnDescription|undefined,
    selectedRow?: any,
    cellStyle?: CSSProperties
}