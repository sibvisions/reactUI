/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the data of the dataprovider, it updates whenever the dataprovider gets updated
 * @param compId - componentId of screen
 * @param dataProvider - the dataprovider
 */
const useDataProviderData = (compId:string, dataProvider: string): [Array<any>]=> {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of the data received by the dataprovider */
    const [data, setData] = useState<Array<any>>(context.contentStore.getData(compId, dataProvider));

    /**
     * Subscribes to dataChange which will update the data state everytime the dataprovider updates
     * @returns unsubscribes from dataChange
     */
    useEffect(() => {
        /** Get the data from the dataProvider and set the state */
        const onDataChange = () => {
            const a = context.contentStore.getData(compId, dataProvider);
            setData([...a])
        }
        context.contentStore.subscribeToDataChange(compId, dataProvider, onDataChange);
        return () => {
            context.contentStore.unsubscribeFromDataChange(compId, dataProvider, onDataChange);
        }
    }, [context.contentStore, dataProvider, compId]);

    return [data];
}
export default useDataProviderData