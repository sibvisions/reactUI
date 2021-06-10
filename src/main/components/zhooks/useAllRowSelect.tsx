/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { getDataProvidersOfComp } from "../util";

/**
 * This hook returns every currently selected Row of all dataproviders of a component as Map
 * @param compId - the component id of the screen
 * @param dataBooks - the databooks of the component
 * @param column - the column
 * @returns  every currently selected Row of all dataproviders of a component as Map
 */
const useAllRowSelect = (compId:string, dataBooks:string[], column?:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of dataMap */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, any>>(getDataProvidersOfComp(context.contentStore.dataProviderSelectedRow.get(compId), dataBooks, column));

    useEffect(() => {
        const onScreenSelectedRowChange = () => {
            const a = getDataProvidersOfComp(context.contentStore.dataProviderSelectedRow.get(compId), dataBooks, column);
            setSelectedRowMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenRowChange(compId, onScreenSelectedRowChange);
        return () => context.subscriptions.unsubscribeFromScreenRowChange(compId);
    }, [context.contentStore, context.subscriptions, compId, dataBooks, column]);

    return selectedRowMap;
}
export default useAllRowSelect;