import { useContext, useEffect, useState } from "react";
import { appContext } from "../../AppProvider";
import { getScreensData } from "../util";

/**
 * This hook returns the current data of all dataproviders of a component as Map
 * @param screenName - the name of the screen
 * @param dataBooks - the databooks of the component
 * @returns the current data of all dataproviders of a component as Map
 */
const useAllDataProviderData = (screenName:string, dataBooks:string[]): Map<string, any> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, any>>(getScreensData(context.contentStore.getScreenDataproviderMap(screenName), dataBooks));

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** sets the state */
        const onScreenDataChange = () => {
            const a = getScreensData(context.contentStore.getScreenDataproviderMap(screenName), dataBooks)
            setDataMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenDataChange(screenName, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(screenName);
    },[context.contentStore, context.subscriptions, screenName, dataBooks]);

    return dataMap
}
export default useAllDataProviderData;