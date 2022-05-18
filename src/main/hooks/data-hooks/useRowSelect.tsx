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

import { useContext, useEffect, useMemo, useState } from "react";
import { appContext } from "../../AppProvider";

/**
 * This hook returns the current state of either the entire selectedRow or the value of the column of the selectedRow 
 * of the databook sent by the server for the given component
 * @param screenName - the name of the screen
 * @param dataProvider - the dataprovider
 * @param column - the column
 */
const useRowSelect = (screenName:string, dataProvider: string, column?: string, showIndex?:boolean, rowIndex?:number) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /**
     * Returns either the value of the column of the currently selectedRow or the entire selectedRow
     * @returns either the value of the column of the currently selectedRow or the entire selectedRow
     */
    const currentlySelectedRow = useMemo(() => {
        const sr = context.contentStore.getDataBook(screenName, dataProvider)?.selectedRow;
        if (sr) {
            if (rowIndex === undefined || (rowIndex !== undefined && rowIndex === sr.index)) {
                if (column && sr.dataRow) {
                    return !showIndex ? sr.dataRow[column] : {data: sr.dataRow[column], index: sr.index, selectedColumn: sr.selectedColumn};
                }
                else {
                    return !showIndex ? sr.dataRow : {data: sr.dataRow, index: sr.index, selectedColumn: sr.selectedColumn};
                }
            }
            else {
                const data = context.contentStore.getDataBook(screenName, dataProvider)?.data?.get("current")[rowIndex]
                if (data) {
                    if (column) {
                        const dataCol = data[column]
                        return !showIndex ? dataCol : {data: dataCol, index: sr.index, selectedColumn: sr.selectedColumn}
                    }
                    else {
                        return !showIndex ? data : {data: data, index: sr.index, selectedColumn: sr.selectedColumn}
                    }
                }                
            }
        }
    }, [context.contentStore, dataProvider, column, screenName, rowIndex]);

    /** The current state of either the entire selectedRow or the given columns value of the selectedRow */
    const [selectedRow, setSelectedRow] = useState<any>(currentlySelectedRow);


    /**
     * Subscribes to rowSelection which updates the value of selectedRow
     * @returns unsubscribes from rowSelection
     */
    useEffect(() => {
        const onRowSelection = (newRow: any) => {
            if (newRow) {
                if (rowIndex === undefined || (rowIndex !== undefined && rowIndex === newRow.index)) {
                    if(column && newRow.dataRow) {
                        setSelectedRow(!showIndex ? newRow.dataRow[column] : {data: newRow.dataRow[column], index: newRow.index, selectedColumn: newRow.selectedColumn});
                    }
                    else {
                        setSelectedRow(!showIndex ? newRow.dataRow : {data: newRow.dataRow, index: newRow.index, selectedColumn: newRow.selectedColumn});
                    }
                }
                else {
                    const data = context.contentStore.getDataBook(screenName, dataProvider)?.data?.get("current")[rowIndex]
                    if (data) {
                        if (column) {
                            const dataCol = data[column];
                            setSelectedRow(!showIndex ? dataCol : {data: dataCol, index: newRow.index, selectedColumn: newRow.selectedColumn});
                        }
                        else {
                            setSelectedRow(!showIndex ? data : {data: data, index: newRow.index, selectedColumn: newRow.selectedColumn});
                        }    
                    }
                    else {
                        setSelectedRow(undefined)
                    }
                }
            }
            else {
                setSelectedRow(undefined)
            }
        }
        context.subscriptions.subscribeToRowSelection(screenName, dataProvider, onRowSelection);

        return () => {
            context.subscriptions.unsubscribeFromRowSelection(screenName, dataProvider, onRowSelection);
        }
    }, [context.subscriptions, dataProvider, column, screenName, rowIndex])

    return [selectedRow];
}
export default useRowSelect