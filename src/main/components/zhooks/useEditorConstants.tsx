import { CSSProperties, useMemo } from "react";
import { useCellEditorStyle, useComponentConstants, useMetaData, useRowSelect } from ".";
import { AppContextType } from "../../AppProvider";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response";
import { CELLEDITOR_CLASSNAMES, IEditor } from "../editors";
import { TopBarContextType } from "../topbar/TopBar";

/**
 * This hook returns constants for cell-editors
 * @param baseProps - the properties of the editor
 * @returns 
 */
const useEditorConstants = <T extends IEditor>(baseProps: T, fb?: CSSProperties): [
    AppContextType,
    TopBarContextType,
    [T],
    CSSProperties | undefined,
    Map<string, string>,
    string,
    string,
    NumericColumnDescription | LengthBasedColumnDescription | undefined,
    any,
    CSSProperties
] => {
    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translations, compStyle] = useComponentConstants<T>(baseProps, fb);

    const cellStyle = useCellEditorStyle(props, compStyle);

    /** The component id of the screen */
    const screenName = useMemo(() => baseProps.isCellEditor ? baseProps.cellScreenName as string : context.contentStore.getScreenName(props.id, props.dataRow) as string, [props.id, props.dataRow, baseProps.isCellEditor, baseProps.cellScreenName])

    /** The name of the rootPanel */
    const rootPanel = useMemo(() => context.contentStore.getRootPanel(props.id) as string, [props.id])

    /** True, if the editor is a checkbox or a choice editor */
    const isCheckOrChoice = useMemo(() => (props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHOICE || props.cellEditor?.className === CELLEDITOR_CLASSNAMES.CHECKBOX), [props.cellEditor?.className]);

    /** The metadata for the specific column */
    const columnMetaData = useMetaData(screenName, props.dataRow, props.columnName, baseProps.cellEditor?.className === CELLEDITOR_CLASSNAMES.NUMBER ? "numeric" : undefined);

    /** The currently selected row */
    const [selectedRow] = useRowSelect(screenName, props.dataRow, props.columnName, isCheckOrChoice ? true : undefined, props.isCellEditor && props.rowIndex ? props.rowIndex() : undefined);

    return [context, topbar, [props], layoutStyle, translations, screenName, rootPanel, columnMetaData, [selectedRow], cellStyle]
}
export default useEditorConstants