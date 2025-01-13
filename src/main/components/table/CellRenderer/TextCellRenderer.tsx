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
import { ICellEditor } from "../../editors/IEditor";
import { ICellRender } from "../CellEditor";
import { appContext } from "../../../contexts/AppProvider";
import { getAlignments } from "../../comp-props/GetAlignments";

/**
 * Renders the text-cell when the column is a text-cell
 * @param props - the properties received from the table
 */
const TextCellRenderer: FC<ICellRender> = (props) => {
    /** A reference to forward to the components */
    const forwardedRef = useRef<any>();

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Casts the cell-editor property to ICellEditor because we can be sure it is a text-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditor;

    // If the contentType is a password, show the password dots or just the cell-data
    const displayTextValue = useMemo(() => {
        if (props.cellData !== null) {
            if (castedCellEditor.contentType === "text/plain;password") {
                return '\u25CF'.repeat(props.cellData.length);
            }
        }
        return props.cellData
    }, [props.cellData, castedCellEditor.contentType]);

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
              {props.icon && props.cellData && <span style={{marginRight: 5}}/>}
              {props.cellData?.includes("<html>") ? <span dangerouslySetInnerHTML={{ __html: props.cellData as string }}/> : <span>{displayTextValue}</span>}
            </span>
        </>
    )
}
export default TextCellRenderer
