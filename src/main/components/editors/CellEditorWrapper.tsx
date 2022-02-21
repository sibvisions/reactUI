/** React imports */
import { FC } from "react";
import { createEditor } from "../../factories/UIFactory";
import { useEditorConstants } from "../zhooks";

/**
 * A Wrapper Component for CellEditors
 * @param baseProps - the properties of a component sent by the server
 */
const CellEditorWrapper:FC<any> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [context, topbar, [props], layoutStyle, translations, compId, columnMetaData, [selectedRow], cellStyle] = useEditorConstants<any>(baseProps, baseProps.editorStyle);

    return createEditor(
        {
            ...props,
            context: context,
            topbar: topbar,
            layoutStyle: layoutStyle,
            translations: translations,
            compId: compId,
            columnMetaData: columnMetaData,
            selectedRow: selectedRow,
            cellStyle: cellStyle
        }
    );
}
export default CellEditorWrapper