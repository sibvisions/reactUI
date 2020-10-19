import React, {CSSProperties, FC} from "react";
import {createEditorText} from "../../../factories/UIFactory";

type cellEditorText = {
    name: string,
    dataProvider: string,
    onBlur: Function
    columnName: string
    text: string
    style?: CSSProperties
}

const CellEditorText: FC<cellEditorText> = (props) => {

    const testDummy = createEditorText({
        cellEditor_editable_: true,
        enabled: true,
        name: props.name,
        columnName: props.columnName,
        dataRow: props.dataProvider,
        onSubmit: props.onBlur,
        className: "",
        constraints:"",
        id: "none",
        style: props.style,
    });

    return testDummy
}
export default CellEditorText