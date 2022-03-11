/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { getScreenSelectedRows } from "../util";

/**
 * This hook returns every currently selected Row of all dataproviders of a component as Map
 * @param screenName - the name of the screen
 * @param dataBooks - the databooks of the component
 * @param column - the column
 * @returns  every currently selected Row of all dataproviders of a component as Map
 */
const useAllRowSelect = (screenName:string, dataBooks:string[]) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of dataMap */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, any>>(getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(screenName), dataBooks));

    useEffect(() => {
        const onScreenSelectedRowChange = () => {
            const a = getScreenSelectedRows(context.contentStore.getScreenDataproviderMap(screenName), dataBooks);
            setSelectedRowMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenRowChange(screenName, onScreenSelectedRowChange);
        return () => context.subscriptions.unsubscribeFromScreenRowChange(screenName);
    }, [context.contentStore, context.subscriptions, screenName, dataBooks]);

    return selectedRowMap;
}
export default useAllRowSelect;