/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";
import { getDataProvidersOfComp } from "../util/GetDataProvidersOfComp";

/**
 * This hook returns the current data of all dataproviders of a component as map
 * @param compId - the component id of the screen
 * @param databooks - the databooks of the component
 * @returns the current data of all dataproviders of a component as map
 */
const useAllDataProviderData = (compId:string, dataBooks:string[]): Map<string, any> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
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