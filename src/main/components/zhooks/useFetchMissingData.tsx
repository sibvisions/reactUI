import { useContext, useLayoutEffect } from "react";
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const useFetchMissingData = (parent: string, compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    useLayoutEffect(() => {
        if (dataProvider && !context.contentStore.getDataBook(compId, dataProvider)?.data) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            if (!context.contentStore.getDataBook(compId, dataProvider)?.metaData) {
                fetchReq.includeMetaData = true;
            }
            if (context.contentStore.missingDataCalls.has(parent)) {
                context.contentStore.missingDataCalls.get(parent)!.set(dataProvider, () => showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar));
            }
        }
    }, []);
}
export default useFetchMissingData