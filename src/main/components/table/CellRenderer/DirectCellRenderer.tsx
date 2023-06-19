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

import React, { FC, useRef } from "react";
import CellEditorWrapper from "../../editors/CellEditorWrapper";
import { ICellRender } from "../CellEditor";
import useConstants from "../../../hooks/components-hooks/useConstants";

/**
 * This Component renders Direct-Cell-Editors, which can be clicked directly and don't have to be opened extra. Eg. Checkbox and Choice
 * @param props - the properties received from the table
 */
const DirectCellRenderer: FC<ICellRender> = (props) => {
    const forwardedRef = useRef<any>();

    const [context, topbar] = useConstants();

    return (
        <>
            <span className="cell-data-content" style={{ display: "flex", justifyContent: "center", alignItems:"center" }}>
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
                        readonly: props.columnMetaData?.readonly || props.dataProviderReadOnly,
                        isCellEditor: true,
                        rowNumber: props.rowNumber,
                        colIndex: props.colIndex,
                        forwardedRef: forwardedRef,
                        context: context,
                        topbar: topbar,
                        layoutStyle: { width: "100%", height: "100%" }
                    }}
                />
            </span>
        </>
    )
}
export default DirectCellRenderer
