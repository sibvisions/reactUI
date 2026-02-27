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

import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { appContext } from "../../../contexts/AppProvider";
import useDataProviderData from "../../../hooks/data-hooks/useDataProviderData";
import { fetchLinkedRefDatabook, getDisplayValue, ICellEditorLinked } from "../../editors/linked/UIEditorLinked";
import { ICellRender } from "../CellEditor";
import useMetaData from "../../../hooks/data-hooks/useMetaData";
import { getAlignments } from "../../comp-props/GetAlignments";

/**
 * Renders the linked-cell when the column is a linked-cell
 * @param props - the properties received from the table
 */
const LinkedCellRenderer: FC<ICellRender> = (props) => {
    /** Casts the cell-editor property to ICellEditorLinked because we can be sure it is a linked-cell-editor */
    const cellEditorMetaData = props.columnMetaData.cellEditor as ICellEditorLinked

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, cellEditorMetaData.linkReference.referencedDataBook ?? "");

    const linkedColumnMetaData = useMetaData(props.screenName, cellEditorMetaData.linkReference.referencedDataBook, props.colName);

    /** Flag to rerender when the displayMap changes */
    const [displayMapChanged, setDisplayMapChanged] = useState<boolean>(false);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True if the linkRef has already been fetched */
    const linkRefFetchFlag = useMemo(() => providedData.length > 0, [providedData]);

    /** True, if there is a displayReferencedColumnName or a displayConcatMask */
    const isDisplayRefColNameOrConcat = useMemo(() => cellEditorMetaData.displayReferencedColumnName || cellEditorMetaData.displayConcatMask, [cellEditorMetaData.displayReferencedColumnName, cellEditorMetaData.displayConcatMask]);

    // Subscribes to displayMap changes
    useEffect(() => {
        context.subscriptions.subscribeToLinkedDisplayMap(props.screenName, cellEditorMetaData.linkReference.referencedDataBook, () => setDisplayMapChanged(prevState => !prevState));

        return () => context.subscriptions.unsubscribeFromLinkedDisplayMap(props.screenName, cellEditorMetaData.linkReference.referencedDataBook, () => setDisplayMapChanged(prevState => !prevState));
    },[context.subscriptions])

    // If there is a cell-data fetch the linkedReference Databook so the correct value can be displayed
    useEffect(() => {
        if (props.cellData !== undefined) {
            fetchLinkedRefDatabook(
                props.screenName, 
                cellEditorMetaData.linkReference.referencedDataBook,
                props.cellData, 
                cellEditorMetaData.displayReferencedColumnName,
                cellEditorMetaData.displayConcatMask,
                context.server,
                context.contentStore,
                undefined,
                (databook:string) => props.decreaseCallback ? props.decreaseCallback(databook) : undefined
            );
        }
    }, []);

    /** The displayValue to display */ 
    const linkedDisplayValue = useMemo(
        () => getDisplayValue(props.rowData, undefined, cellEditorMetaData.linkReference, props.colName, isDisplayRefColNameOrConcat, cellEditorMetaData, props.dataProvider, props.columnMetaData.dataTypeIdentifier, linkedColumnMetaData, context), 
        [props.cellData, linkRefFetchFlag, cellEditorMetaData, props.rowData, props.colName, displayMapChanged, props.columnMetaData.dataTypeIdentifier, linkedColumnMetaData, context]
    )

    const alignments = useMemo(() => getAlignments({...cellEditorMetaData}), [cellEditorMetaData]);

    return (
        <>
            <span className="cell-data-content">
                {props.icon != undefined && props.icon}
                {props.icon && linkedDisplayValue && <span style={{marginRight: 5}}/>}
                <div style={{
                    display: "flex", 
                    justifyContent: alignments.ha, 
                    alignItems: alignments.va, 
                    width: "100%" 
                }}>{linkedDisplayValue}</div>
            </span>
            {props.isEditable ? <div style={{ 
                    display: document.getElementById(props.screenName)?.style.visibility === "hidden" ? "none" : undefined, 
                    marginLeft: "7px" 
                }} 
                tabIndex={-1} 
                onClick={props.stateCallback !== undefined ? () => (props.stateCallback as Function)() : undefined} 
            >
                <i className="pi pi-chevron-down cell-editor-arrow" />
            </div> : null }
        </>
    )
}
export default LinkedCellRenderer