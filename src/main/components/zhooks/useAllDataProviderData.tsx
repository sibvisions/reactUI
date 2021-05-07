/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { getDataProvidersOfComp } from "../util";

/**
 * This hook returns the current data of all dataproviders of a component as Map
 * @param compId - the component id of the screen
 * @param databooks - the databooks of the component
 * @returns the current data of all dataproviders of a component as Map
 */
const useAllDataProviderData = (compId:string, dataBooks:string[]): Map<string, any> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, any>>(getDataProvidersOfComp(context.contentStore.dataProviderData.get(compId), dataBooks));

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** sets the state */
        const onScreenDataChange = () => {
            const a = getDataProvidersOfComp(context.contentStore.dataProviderData.get(compId), dataBooks)
            setDataMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenDataChange(compId, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(compId);
    },[context.contentStore, context.subscriptions, compId, dataBooks]);

    return dataMap
}
export default useAllDataProviderData;