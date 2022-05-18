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
