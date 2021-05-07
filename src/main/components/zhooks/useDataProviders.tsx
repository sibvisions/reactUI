/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

/**
 * This hook returns the dataProviders of a screen, 
 * it updates whenever there is a new dataProvider for the screen
 * @param compId - the component id of the screen
 */
const useDataProviders = (compId:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of all dataprovider of a screen */
    const [dataProviders, setDataProviders] = useState<Array<string>>(Array.from(context.contentStore.dataProviderMetaData.get(compId)?.keys() as IterableIterator<string>));

    useEffect(() => {
        const onDataProviderChange = () => {
            if (context.contentStore.dataProviderData.has(compId))
                setDataProviders(Array.from(context.contentStore.dataProviderMetaData.get(compId)?.keys() as IterableIterator<string>))
        }
        context.subscriptions.subscribeToDataProviders(compId, onDataProviderChange);
        return () => context.subscriptions.unsubscribeFromDataProviders(compId, onDataProviderChange);
    }, [context.subscriptions, compId]);

    return dataProviders;
}
export default useDataProviders