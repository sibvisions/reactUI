import { useContext, useLayoutEffect } from "react";
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const useFetchMissingData = (compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    useLayoutEffect(() => {
        if (!context.contentStore.dataProviderData.get(compId)?.has(dataProvider)) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            if (!context.contentStore.dataProviderMetaData.get(compId)?.has(dataProvider)) {
                fetchReq.includeMetaData = true;
            }
            showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar);
        }
    },[])
}
export default useFetchMissingData