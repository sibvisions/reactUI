/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { isValid, format, formatISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import React, { FC, useContext, useMemo } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { getDateLocale, getGlobalLocale } from "../../../util/other-util/GetDateLocale";
import { ICellEditorDate } from "../../editors/date/UIEditorDate";
import { ICellRender } from "../CellEditor";

/**
 * Renders the date-cell when the column is a date-cell
 * @param props - the properties received from the table
 */
const DateCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Casts the cell-editor property to ICellEditorDate because we can be sure it is a date-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorDate;

    /** Returns the date to display if the date is valid or null */
    const displayDateValue = useMemo(() => {
        if (isValid(props.cellData) && castedCellEditor) {
            const timeZone = castedCellEditor.timeZone ? castedCellEditor.timeZone : context.appSettings.timeZone;
            return castedCellEditor.dateFormat ? formatInTimeZone(props.cellData, timeZone, castedCellEditor.dateFormat, { locale: castedCellEditor.locale ? getDateLocale(context.appSettings.locale) : getGlobalLocale() }) : formatISO(props.cellData);
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
