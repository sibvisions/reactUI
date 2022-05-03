import React, { FC } from "react";
import { CellEditorWrapper } from "../../editors";
import { ICellRender } from "../";

const DirectCellRenderer: FC<ICellRender> = (props) => {
    return (
        <>
            <div className="cell-data-content" style={{ display: "flex", justifyContent: "center", alignItems:"center" }}>
                <CellEditorWrapper
                    {...{
                        id: "",
                        ...props.columnMetaData,
                        name: props.name,
                        dataRow: props.dataProvider,
                        columnName: props.colName,
                        cellEditor_editable_: true,
                        editorStyle: { width: "100%", height: "100%" },
                        autoFocus: true,
                        rowIndex: () => props.rowNumber,
                        filter: props.filter,
                        readonly: props.columnMetaData?.readonly,
                        isCellEditor: true,
                        cellScreenName: props.dataProvider.split("/")[1],
                        rowNumber: props.rowNumber,
                        colIndex: props.colIndex
                    }}
                />
            </div>
        </>
    )
}
export default DirectCellRenderer
