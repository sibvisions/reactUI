import { CSSProperties, FC, useMemo } from "react";
import { AppContextType } from "../../AppProvider";
import { createEditor } from "../../factories/UIFactory";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
import { IInTableEditor } from "../table/CellDisplaying";
import { TopBarContextType } from "../topbar/TopBar";
import { useEditorConstants, useFetchMissingData } from "../../hooks";
import { IEditor } from "./IEditor";
import { isCellEditorReadOnly } from "./text/UIEditorText";
import { CellFormatting } from "../table/CellEditor";

/** Interface which contains values the CellEditorWrapper passes down to the CellEditor it renders */
export interface ICellEditorWrapperProps {
    context: AppContextType,
    topbar: TopBarContextType,
    layoutStyle?: CSSProperties,
    translations: Map<string, string>,
    screenName: string,
    columnMetaData: NumericColumnDescription | LengthBasedColumnDescription | undefined,
    selectedRow: any,
    cellStyle: CSSProperties,
    rowIndex?: Function,
    filter?: Function
    isReadOnly: boolean
    rowNumber: number
    cellFormatting?: CellFormatting
}

/** The complete interface for ReactUI CellEditors. It extends the server-sent properties, wrapper properties and in-table-properties */
export interface IRCCellEditor extends IEditor, ICellEditorWrapperProps, IInTableEditor {

}

/**
 * A Wrapper Component for CellEditors
 * @param baseProps - the properties of a component sent by the server
 */
const CellEditorWrapper:FC<any> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [context, topbar, [props], layoutStyle, translations, screenName, columnMetaData, [selectedRow], cellStyle] = useEditorConstants<any>(baseProps, baseProps.editorStyle);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(screenName, props.dataRow);

    /** If the CellEditor is read-only */
    const isReadOnly = useMemo(() => isCellEditorReadOnly(props), [props.isCellEditor, props.readonly, props.cellEditor_editable_, props.enabled]);

    return createEditor(
        {
            ...props,
            context: context,
            topbar: topbar,
            layoutStyle: layoutStyle,
            translations: translations,
            screenName: screenName,
            columnMetaData: columnMetaData,
            selectedRow: selectedRow,
            cellStyle: cellStyle,
            isReadOnly: isReadOnly,
            cellFormatting: baseProps.cellFormatting
        }
    );
}
export default CellEditorWrapper