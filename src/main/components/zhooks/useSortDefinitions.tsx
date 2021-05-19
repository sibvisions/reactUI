/** React imports */
import { useContext, useState, useEffect } from "react"

/** Other imports */
import { appContext } from "../../AppProvider";
import { SortDefinition } from "../../request";

const useSortDefinitions = (compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The current state of the sortDefinitions for the dataprovider */
    const [sortDefinitions, setSortDefinitions] = useState<SortDefinition[]|undefined>(context.contentStore.dataProviderSortedColumns.get(compId)?.get(dataProvider));

    /**
     * Subscribes to sort-definitions which updates the value of sortDefinitions
     * @returns unsubscribes from sort-definitions
     */
    useEffect(() => {
        context.subscriptions.subscribeToSortDefinitions(compId, dataProvider, () => setSortDefinitions(context.contentStore.dataProviderSortedColumns.get(compId)?.get(dataProvider)));

        return () => context.subscriptions.unsubscribeFromSortDefinitions(compId, dataProvider, () => setSortDefinitions(context.contentStore.dataProviderSortedColumns.get(compId)?.get(dataProvider)));
    }, [context.subscriptions, compId, dataProvider]);

    return [sortDefinitions]
}
export default useSortDefinitions;