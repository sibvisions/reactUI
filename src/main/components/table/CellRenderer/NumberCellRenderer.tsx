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

import React, { FC, useContext, useMemo, useRef } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { NumericColumnDescription } from "../../../response/data/MetaDataResponse";
import { formatNumber, getGrouping } from "../../../util/component-util/NumberProperties";
import { getNumberValueAsString, getPrefix, getSuffix, ICellEditorNumber } from "../../editors/number/UIEditorNumber";
import { ICellRender } from "../CellEditor";
import { getAlignments } from "../../comp-props/GetAlignments";

/**
 * Renders the number-cell when the column is a number-cell
 * @param props - the properties received from the table
 */
const NumberCellRenderer: FC<ICellRender> = (props) => {
    /** A reference to forward to the components */
    const forwardedRef = useRef<HTMLDivElement>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    // Casts the metadata to NumericColumnDescription
    const castedMetaData = props.columnMetaData as NumericColumnDescription

    /** Casts the cell-editor property to ICellEditorDate because we can be sure it is a date-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorNumber;

    /** Whether the value should be grouped or not */
    const useGrouping = getGrouping(castedCellEditor.numberFormat);

    // Formats the number value to the correct format
    const displayNumberValue = useMemo(() => {
        if (props.cellData !== null) {
            return getPrefix(castedCellEditor.numberFormat, getNumberValueAsString(props.cellData, castedCellEditor.numberFormat), true, context.appSettings.locale, useGrouping) + formatNumber(castedCellEditor.numberFormat, context.appSettings.locale, getNumberValueAsString(props.cellData, castedCellEditor.numberFormat), castedMetaData.scale) + getSuffix(castedCellEditor.numberFormat, context.appSettings.locale, castedMetaData.scale)
        }
        else {
            return ""
        }
    }, [props.cellData, castedMetaData, castedCellEditor]);

    const alignments = useMemo(() => getAlignments({...castedCellEditor}), [castedCellEditor]);

    return (
        <>
            <span 
                className="cell-data-content" 
                style={{ 
                    display: "flex", 
                    justifyContent: alignments.ha, 
                    alignItems: alignments.va, 
                    width: "100%" 
                }}
            >
                {props.icon != undefined && props.icon}
                {props.icon && displayNumberValue && <span style={{marginRight: 5}}/>}
                <span 
                    className="cell-data-content-number"
                    style={{
                        justifyContent: alignments.ha, 
                        alignItems: alignments.va
                    }}
                >{displayNumberValue}</span>
            </span>
        </>
    )
}
export default NumberCellRenderer
