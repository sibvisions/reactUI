/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

/**
 * This hook returns the data of the dataprovider, it updates whenever the dataprovider gets updated
 * @param compId - componentId of screen
 * @param dataProvider - the dataprovider
 */
const useDataProviderData = (compId:string, dataProvider:string): [any]=> {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the data received by the dataprovider */
    const [data, setData] = useState<any>(context.contentStore.getData(compId, dataProvider));

    /**
     * Subscribes to dataChange which will update the data state everytime the dataprovider updates
     * @returns unsubscribes from dataChange
     */
    useEffect(() => {
        /** Get the data from the dataProvider and set the state */
        const onDataChange = () => {
            const a = context.contentStore.getData(compId, dataProvider);
            setData([...a]);
        }
        context.subscriptions.subscribeToDataChange(compId, dataProvider, onDataChange);
        return () => context.subscriptions.unsubscribeFromDataChange(compId, dataProvider, onDataChange);
    }, [context.subscriptions, dataProvider, compId, context.contentStore]);

    return [data];
}
export default useDataProviderData