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

import React, { FC, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { createFilterRequest } from "../../../factories/RequestFactory";
import useDataProviderData from "../../../hooks/data-hooks/useDataProviderData";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
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

    const previousDataMap = useRef<Map<string, string>>();

    // If there is a cell-data fetch the linkedReference Databook so the correct value can be displayed
    useEffect(() => {
        if (props.cellData) {
            context.contentStore.clearDataFromProvider(props.screenName, castedCellEditor.linkReference.referencedDataBook)
            const filterReq = createFilterRequest();
            filterReq.dataProvider = castedCellEditor.linkReference.referencedDataBook;
            filterReq.editorComponentId = props.name;
            filterReq.value = "";
        
            context.server.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER);

            fetchLinkedRefDatabook(
                props.screenName, 
                castedCellEditor.linkReference.referencedDataBook,
                props.cellData, 
                castedCellEditor.displayReferencedColumnName,
                castedCellEditor.displayConcatMask,
                context.server,
                context.contentStore
            );
        }
    }, []);

    /** A map which stores the referenced-column-values as keys and the display-values as value */
    const dataToDisplayMap = useMemo(() => {
        const map:Map<string, string> = new Map<string, string>(previousDataMap.current);
        if (providedData.length) {
            providedData.forEach((data:any) => {
                const extractedObject = getExtractedObject(data, castedCellEditor.linkReference.referencedColumnNames);
                if (castedCellEditor.displayReferencedColumnName) {
                    map.set(JSON.stringify(extractedObject), data[castedCellEditor.displayReferencedColumnName as string]);
                }
                else if (castedCellEditor.displayConcatMask) {
                    let displayString = "";
                    if (castedCellEditor.displayConcatMask.includes("*")) {
                        displayString = castedCellEditor.displayConcatMask
                        const count = (castedCellEditor.displayConcatMask.match(/\*/g) || []).length;
                        for (let i = 0; i < count; i++) {
                            displayString = displayString.replace('*', data[castedCellEditor.columnView.columnNames[i]] !== undefined ? data[castedCellEditor.columnView.columnNames[i]] : "");
                        }
                    }
                    else {
                        castedCellEditor.columnView.columnNames.forEach((column, i) => {
                            displayString += data[column] + (i !== castedCellEditor.columnView.columnNames.length - 1 ? castedCellEditor.displayConcatMask : "");
                        });
                    }
                    map.set(JSON.stringify(extractedObject), displayString);
                }
            });
        }
        previousDataMap.current = map;
        return map;

    }, [linkRefFetchFlag, providedData, castedCellEditor.linkReference.referencedColumnNames, castedCellEditor.displayConcatMask, castedCellEditor.displayReferencedColumnName, castedCellEditor.columnView]);

    /**
     * Returns the displayValue to display
     * @param value - the datarow which should be displayed
     */
    const getDisplayValue = useCallback((value:any) => {
        if (isDisplayRefColNameOrConcat) {
            if (dataToDisplayMap?.has(JSON.stringify(value))) {
                return dataToDisplayMap.get(JSON.stringify(value))
            }
        }
        return value[props.colName]
    },[isDisplayRefColNameOrConcat, linkRefFetchFlag, dataToDisplayMap])

    /** The displayValue to display */ 
    const linkedDisplayValue = useMemo(() => {
        if (dataToDisplayMap?.size) {
            return getDisplayValue(getExtractedObject(convertColNamesToReferenceColNames(props.rowData, castedCellEditor.linkReference), castedCellEditor.linkReference.referencedColumnNames))
        }
        else {
            return getDisplayValue(props.rowData)
        }
        
    }, [props.cellData, linkRefFetchFlag, dataToDisplayMap]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? linkedDisplayValue}
            </div>
            <div style={{ display: document.getElementById(props.screenName)?.style.visibility === "hidden" ? "none" : undefined, marginLeft: "auto" }} tabIndex={-1} onClick={props.stateCallback !== undefined ? () => (props.stateCallback as Function)() : undefined} >
                <i className="pi pi-chevron-down cell-editor-arrow" />
            </div>
        </>
    )
}
export default LinkedCellRenderer