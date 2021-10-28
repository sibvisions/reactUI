import { useContext, useLayoutEffect, useState } from "react";
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const useFetchMissingData = (compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    const [mdReady, setMdReady] = useState<boolean>(false);

    useLayoutEffect(() => {
        context.subscriptions.subscribeToMissingData(compId, () => setMdReady(true));
        return () => context.subscriptions.unsubscribeFromMissingData(compId, () => setMdReady(true));
    }, [dataProvider])

    useLayoutEffect(() => {
        if (mdReady) {
            if (dataProvider && !context.contentStore.getDataBook(compId, dataProvider)?.data) {
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = dataProvider;
                if (!context.contentStore.getDataBook(compId, dataProvider)?.metaData) {
                    fetchReq.includeMetaData = true;
                }
                showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar);
            }
        }
    },[mdReady]);
}
export default useFetchMissingData