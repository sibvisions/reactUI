/** React imports */
import { FC } from "react";
import { createEditor } from "../../factories/UIFactory";
import { useProperties } from "../zhooks";

const CellEditorWrapper:FC<any> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<any>(baseProps.id, baseProps);

    return createEditor(props);
}
export default CellEditorWrapper