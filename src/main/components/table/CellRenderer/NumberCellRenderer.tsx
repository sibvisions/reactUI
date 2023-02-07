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

import React, { FC, useContext, useMemo } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { NumericColumnDescription } from "../../../response/data/MetaDataResponse";
import { formatNumber } from "../../../util/component-util/NumberProperties";
import { getPrefix, getSuffix, ICellEditorNumber } from "../../editors/number/UIEditorNumber";
import { ICellRender } from "../CellEditor";

/**
 * Renders the number-cell when the column is a number-cell
 * @param props - the properties received from the table
 */
const NumberCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    // Casts the metadata to NumericColumnDescription
    const castedMetaData = props.columnMetaData as NumericColumnDescription

    /** Casts the cell-editor property to ICellEditorDate because we can be sure it is a date-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorNumber;

    // Formats the number value to the correct format
    const displayNumberValue = useMemo(() => {
        //if (props.cellData !== null) {
            return getPrefix(castedCellEditor.numberFormat, props.cellData, true, context.appSettings.locale) + formatNumber(castedCellEditor.numberFormat, context.appSettings.locale, props.cellData) + getSuffix(castedCellEditor.numberFormat, context.appSettings.locale)
        //}
        //return props.cellData
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
