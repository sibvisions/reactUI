/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current data of all dataproviders of a screen as map
 * @param compId - the component id of the screen
 * @returns the current data of all dataproviders of a screen as map
 */
const useScreenData = (compId:string): Map<string, Array<any>>|undefined => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, Array<any>>|undefined>(context.contentStore.dataProviderData.get(compId));

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** Get the data of the screen and set the state */
        const onScreenDataChange = () => {
            const a = context.contentStore.dataProviderData.get(compId)
            setDataMap(a ? new Map(a) : undefined);
        }

        context.subscriptions.subscribeToScreenDataChange(compId, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(compId);
    },[context.subscriptions])

    return dataMap
}
export default useScreenData;