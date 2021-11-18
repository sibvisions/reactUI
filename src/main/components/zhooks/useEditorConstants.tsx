import { CSSProperties, useMemo } from "react";
import { useComponentConstants, useMetaData, useRowSelect } from ".";
import { AppContextType } from "../../AppProvider";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
import { CELLEDITOR_CLASSNAMES, IEditor } from "../editors";
import { TopBarContextType } from "../topbar/TopBar";

/**
 * This hook returns constants for cell-editors
 * @param baseProps - the properties of the editor
 * @returns 
 */
const useEditorConstants = <T extends IEditor> (baseProps:T, fb?:CSSProperties): [
    AppContextType, 
    TopBarContextType, 
    [T], 
    CSSProperties|undefined, 
    Map<string, string>,
    string,
    NumericColumnDescription|LengthBasedColumnDescription|undefined,
    any
] => {
    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translations] = useComponentConstants<T>(baseProps, fb);

    /** The component id of the screen */
    const compId = useMemo(() => baseProps.isCellEditor ? baseProps.cellCompId as string : context.contentStore.getComponentId(props.id) as string, [props.id, baseProps.isCellEditor, baseProps.cellCompId])

    /** True, if the editor is a checkbox or a choice editor */
    const isCheckOrChoice = useMemo(() => (props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHOICE || props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHECKBOX), [props.cellEditor?.className]);

    /** The metadata for the specific column */
    const columnMetaData = useMetaData(compId, props.dataRow, props.columnName, baseProps.cellEditor?.className === CELLEDITOR_CLASSNAMES.NUMBER ? "numeric" : undefined);

    /** The currently selected row */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName, isCheckOrChoice ? true : undefined, props.isCellEditor && props.rowIndex ? props.rowIndex() : undefined);

    return [context, topbar, [props], layoutStyle, translations, compId, columnMetaData, [selectedRow]]
}
export default useEditorConstants