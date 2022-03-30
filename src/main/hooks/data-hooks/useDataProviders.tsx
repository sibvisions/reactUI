import { useContext, useEffect, useState } from "react";
import { appContext } from "../../AppProvider";

/**
 * This hook returns the dataProviders of a screen, 
 * it updates whenever there is a new dataProvider for the screen
 * @param screenName - the name of the screen
 */
const useDataProviders = (screenName:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of all dataprovider of a screen */
    const [dataProviders, setDataProviders] = useState<Array<string>>(Array.from(context.contentStore.getScreenDataproviderMap(screenName) ? context.contentStore.getScreenDataproviderMap(screenName)!.keys() as IterableIterator<string> : []));

    // Subscribes to the dataproviders of a screen
    useEffect(() => {
        const onDataProviderChange = () => {
            if (context.contentStore.getScreenDataproviderMap(screenName)) {
                setDataProviders(Array.from(context.contentStore.getScreenDataproviderMap(screenName)!.keys() as IterableIterator<string>))
            }
        }
        context.subscriptions.subscribeToDataProviders(screenName, onDataProviderChange);
        return () => context.subscriptions.unsubscribeFromDataProviders(screenName, onDataProviderChange);
    }, [context.subscriptions, screenName]);

    return dataProviders;
}
export default useDataProviders