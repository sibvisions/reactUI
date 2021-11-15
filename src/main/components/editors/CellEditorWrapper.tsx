/** React imports */
import { FC } from "react";
import { createEditor } from "../../factories/UIFactory";
import { useProperties } from "../zhooks";

/**
 * A Wrapper Component for CellEditors
 * @param baseProps - the properties of a component sent by the server
 */
const CellEditorWrapper:FC<any> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<any>(baseProps.id, baseProps);

    return createEditor(props);
}
export default CellEditorWrapper