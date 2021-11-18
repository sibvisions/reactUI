/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { getScreenSelectedRows } from "../util";

/**
 * This hook returns every currently selected Row of all dataproviders of a component as Map
 * @param compId - the component id of the screen
 * @param dataBooks - the databooks of the component
 * @param column - the column
 * @returns  every currently selected Row of all dataproviders of a component as Map
 */
const useAllRowSelect = (compId:string, dataBooks:string[]) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of dataMap */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, any>>(getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(compId), dataBooks));

    useEffect(() => {
        const onScreenSelectedRowChange = () => {
            const a = getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(compId), dataBooks);
            setSelectedRowMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenRowChange(compId, onScreenSelectedRowChange);
        return () => context.subscriptions.unsubscribeFromScreenRowChange(compId);
    }, [context.contentStore, context.subscriptions, compId, dataBooks]);

    return selectedRowMap;
}
export default useAllRowSelect;