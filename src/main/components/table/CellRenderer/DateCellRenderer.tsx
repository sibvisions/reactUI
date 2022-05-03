import { isValid, format, formatISO } from "date-fns";
import React, { FC, useContext, useMemo } from "react";
import { appContext } from "../../../AppProvider";
import { getDateLocale } from "../../../util";
import { ICellEditorDate } from "../../editors";
import { ICellRender } from "../";

const DateCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorDate;

    const displayDateValue = useMemo(() => {
        if (isValid(props.cellData) && castedCellEditor) {
            return castedCellEditor.dateFormat ? format(props.cellData, castedCellEditor.dateFormat, { locale: getDateLocale(context.appSettings.locale) }) : formatISO(props.cellData);
        }
        else {
            return null;
        }
    }, [props.columnMetaData, castedCellEditor, props.cellData]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? displayDateValue}
            </div>
            <div style={{ display: document.getElementById(props.screenName)?.style.visibility === "hidden" ? "none" : undefined, marginLeft: "auto" }} tabIndex={-1} onClick={props.stateCallback !== undefined ? () => (props.stateCallback as Function)() : undefined} >
                <i className="pi pi-chevron-down cell-editor-arrow" />
            </div>
        </>
    )
}
export default DateCellRenderer
