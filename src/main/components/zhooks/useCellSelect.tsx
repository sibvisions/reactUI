/** React imports */
import { useContext, useEffect, useMemo, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";

const useCellSelect = (compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [selectedColumn, setSelectedColumn] = useState<string|undefined>(context.contentStore.dataProviderSelectedColumns.get(compId)?.get(dataProvider));

    useEffect(() => {
        context.subscriptions.subscribeToSelectedColumn(compId, dataProvider, () => setSelectedColumn(context.contentStore.dataProviderSelectedColumns.get(compId)?.get(dataProvider)));

        return () => context.subscriptions.unsubscribeFromSelectedColumns(compId, dataProvider, () => setSelectedColumn(context.contentStore.dataProviderSelectedColumns.get(compId)?.get(dataProvider)));
    }, [context.subscriptions, compId, dataProvider]);

    return [selectedColumn]
}
export default useCellSelect