/** React imports */
import {useCallback, useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current data of all dataproviders of a component as map
 * @param compId - the component id of the screen
 * @returns the current data of all dataproviders of a component as map
 */
const useAllDataProviderData = (compId:string, databooks:string[]): Map<string, any> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    /** Returns dataproviders of a component or an empty Map if there are no dataproviders */
    const getDataProvidersOfComp = useCallback(() => {
        if (context.contentStore.dataProviderData.get(compId) !== undefined) {
            const tempMap = new Map(context.contentStore.dataProviderData.get(compId)!);
            if (tempMap) {
                for (const [key] of tempMap?.entries()) {
                    if (!databooks.includes(key))
                        tempMap.delete(key)
                }
                return tempMap
            }           
        }
        return new Map()

    },[compId, databooks, context.contentStore])
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, any>>(getDataProvidersOfComp());

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** sets the state */
        const onScreenDataChange = () => {
            const a = getDataProvidersOfComp()
            setDataMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenDataChange(compId, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(compId);
    },[context.subscriptions, compId, getDataProvidersOfComp])

    return dataMap
}
export default useAllDataProviderData;