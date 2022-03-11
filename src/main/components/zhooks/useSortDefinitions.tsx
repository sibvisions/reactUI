/** React imports */
import { useContext, useState, useEffect } from "react"

/** Other imports */
import { appContext } from "../../AppProvider";
import { SortDefinition } from "../../request";

const useSortDefinitions = (screenName:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The current state of the sortDefinitions for the dataprovider */
    const [sortDefinitions, setSortDefinitions] = useState<SortDefinition[]|undefined>(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns);

    /**
     * Subscribes to sort-definitions which updates the value of sortDefinitions
     * @returns unsubscribes from sort-definitions
     */
    useEffect(() => {
        context.subscriptions.subscribeToSortDefinitions(screenName, dataProvider, () => setSortDefinitions(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns));

        return () => context.subscriptions.unsubscribeFromSortDefinitions(screenName, dataProvider, () => setSortDefinitions(context.contentStore.getDataBook(screenName, dataProvider)?.sortedColumns));
    }, [context.subscriptions, screenName, dataProvider]);

    return [sortDefinitions]
}
export default useSortDefinitions;