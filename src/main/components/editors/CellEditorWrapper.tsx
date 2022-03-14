import { FC } from "react";
import { createEditor } from "../../factories/UIFactory";
import { useEditorConstants, useFetchMissingData } from "../zhooks";

/**
 * A Wrapper Component for CellEditors
 * @param baseProps - the properties of a component sent by the server
 */
const CellEditorWrapper:FC<any> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [context, topbar, [props], layoutStyle, translations, screenName, rootPanel, columnMetaData, [selectedRow], cellStyle] = useEditorConstants<any>(baseProps, baseProps.editorStyle);

    // Fetches Data if dataprovider has not been fetched yet
    useFetchMissingData(props.screenName, rootPanel, props.dataRow);

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
            cellStyle: cellStyle
        }
    );
}
export default CellEditorWrapper