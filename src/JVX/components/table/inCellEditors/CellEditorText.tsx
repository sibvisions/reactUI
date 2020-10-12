import React, {CSSProperties, FC, useMemo} from "react";
import UIEditorText from "../../editors/text/UIEditorText";
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
        "cellEditor.editable": true,
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