/** React imports */
import {useContext, useEffect, useMemo, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current state of either the entire selectedRow or the value of the column of the selectedRow 
 * of the databook sent by the server for the given component
 * @param compId - the component id
 * @param dataProvider - the dataprovider
 * @param column - the column
 */
const useRowSelect = (compId:string, dataProvider: string, column?: string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /**
     * Returns either the value of the column of the currently selectedRow or the entire selectedRow
     * @returns either the value of the column of the currently selectedRow or the entire selectedRow
     */
    const currentlySelectedRow = useMemo(() => {
        const sr = context.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider).dataRow
        if(column && sr)
            return sr[column];
        else
            return sr;

    }, [context.contentStore, dataProvider, column, compId]);
    /** The current state of either the entire selectedRow or the given columns value of the selectedRow */
    const [selectedRow, setSelectedRow] = useState<any>(currentlySelectedRow);


    /**
     * Subscribes to rowSelection which updates the value of selectedRow
     * @returns unsubscribes from rowSelection
     */
    useEffect(() => {
        const onRowSelection = (newRow: any) => {
            if(column && newRow)
                setSelectedRow(newRow[column]);
            else
                setSelectedRow(newRow);
        }
        context.subscriptions.subscribeToRowSelection(compId, dataProvider, onRowSelection);
        return () => {
            context.subscriptions.unsubscribeFromRowSelection(compId, dataProvider, onRowSelection);
        }
    }, [context.subscriptions, dataProvider, column, compId])

    return [selectedRow];
}
export default useRowSelect