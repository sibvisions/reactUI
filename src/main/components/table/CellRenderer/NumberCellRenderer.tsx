import React, { FC, useContext, useMemo } from "react";
import { appContext } from "../../../AppProvider";
import { NumericColumnDescription } from "../../../response";
import { getGrouping, getMinimumIntDigits, getScaleDigits } from "../../../util";
import { ICellEditorNumber } from "../../editors";
import { ICellRender } from "../";

const NumberCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const castedMetaData = props.columnMetaData as NumericColumnDescription

    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorNumber;

    const displayNumberValue = useMemo(() => {
        if (props.cellData !== null) {
            return Intl.NumberFormat(context.appSettings.locale,
                {
                    useGrouping: getGrouping(castedCellEditor.numberFormat),
                    minimumIntegerDigits: getMinimumIntDigits(castedCellEditor.numberFormat),
                    minimumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).minScale,
                    maximumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).maxScale
                }).format(props.cellData);
        }
        return props.cellData
    }, [props.cellData, castedMetaData, castedCellEditor]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? displayNumberValue}
            </div>
        </>
    )
}
export default NumberCellRenderer
