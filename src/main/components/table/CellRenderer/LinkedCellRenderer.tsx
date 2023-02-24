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

import React, { FC, useCallback, useContext, useEffect, useMemo } from "react";
import { appContext } from "../../../contexts/AppProvider";
import useDataProviderData from "../../../hooks/data-hooks/useDataProviderData";
import { convertColNamesToReferenceColNames, convertReferenceColNamesToColNames, fetchLinkedRefDatabook, getExtractedObject, ICellEditorLinked } from "../../editors/linked/UIEditorLinked";
import { ICellRender } from "../CellEditor";

/**
 * Renders the linked-cell when the column is a linked-cell
 * @param props - the properties received from the table
 */
const LinkedCellRenderer: FC<ICellRender> = (props) => {
    /** Casts the cell-editor property to ICellEditorLinked because we can be sure it is a linked-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorLinked

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, castedCellEditor.linkReference.referencedDataBook||"");

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True if the linkRef has already been fetched */
    const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    /** True, if there is a displayReferencedColumnName or a displayConcatMask */
    const isDisplayRefColNameOrConcat = useMemo(() => castedCellEditor.displayReferencedColumnName || castedCellEditor.displayConcatMask, [castedCellEditor.displayReferencedColumnName, castedCellEditor.displayConcatMask]);

    // If there is a cell-data fetch the linkedReference Databook so the correct value can be displayed
    useEffect(() => {
        if (props.cellData !== undefined) {
            fetchLinkedRefDatabook(
                props.screenName, 
                castedCellEditor.linkReference.referencedDataBook,
                props.cellData, 
                castedCellEditor.displayReferencedColumnName,
                castedCellEditor.displayConcatMask,
                context.server,
                context.contentStore,
                undefined,
                (databook:string) => props.decreaseCallback ? props.decreaseCallback(databook) : undefined
            );
        }
    }, []);

    /**
     * Returns the displayValue to display
     * @param value - the datarow which should be displayed
     */
    const getDisplayValue = useCallback((value:any) => {
        if (isDisplayRefColNameOrConcat) {
            if (castedCellEditor && castedCellEditor.linkReference.dataToDisplayMap?.has(JSON.stringify(value))) {
                return castedCellEditor.linkReference.dataToDisplayMap.get(JSON.stringify(value))
            }
            else {
                return convertReferenceColNamesToColNames(value, castedCellEditor.linkReference)[props.colName]
            }
        }
        return value[props.colName]
    },[isDisplayRefColNameOrConcat, linkRefFetchFlag, castedCellEditor, props.colName])

    /** The displayValue to display */ 
    const linkedDisplayValue = useMemo(() => {
        if (castedCellEditor && castedCellEditor.linkReference.dataToDisplayMap?.size) {
            const index = castedCellEditor.linkReference.columnNames.findIndex(colName => colName === props.colName);
            return getDisplayValue(getExtractedObject(convertColNamesToReferenceColNames(props.rowData, castedCellEditor.linkReference, props.colName), [castedCellEditor.linkReference.referencedColumnNames[index]]))
        }
        else {
            return getDisplayValue(props.rowData)
        }
        
    }, [props.cellData, linkRefFetchFlag, castedCellEditor, props.rowData, props.colName]);

    return (
        <>
            <span className="cell-data-content">
                {props.icon ?? linkedDisplayValue}
            </span>
            <div style={{ display: document.getElementById(props.screenName)?.style.visibility === "hidden" ? "none" : undefined, marginLeft: "auto" }} tabIndex={-1} onClick={props.stateCallback !== undefined ? () => (props.stateCallback as Function)() : undefined} >
                <i className="pi pi-chevron-down cell-editor-arrow" />
            </div>
        </>
    )
}
export default LinkedCellRenderer