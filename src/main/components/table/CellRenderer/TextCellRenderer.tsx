import React, { FC, useMemo } from "react";
import { ICellEditor } from "../../editors";
import { ICellRender } from "../";

const TextCellRenderer: FC<ICellRender> = (props) => {
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditor;

    const displayTextValue = useMemo(() => {
        if (props.cellData !== null) {
            if (castedCellEditor.contentType === "text/plain;password") {
                return '\u25CF'.repeat(props.cellData.length);
            }
        }
        return props.cellData
    }, [props.cellData, castedCellEditor.contentType]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? props.cellData?.includes("<html>") ? <span dangerouslySetInnerHTML={{ __html: props.cellData as string }}/> : displayTextValue}
            </div>
        </>
    )
}
export default TextCellRenderer
