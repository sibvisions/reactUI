import { useContext, useLayoutEffect } from "react";
import { appContext } from "../../AppProvider";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";

const useFetchMissingData = (compId:string, dataProvider:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    useLayoutEffect(() => {
        if (!context.contentStore.dataProviderData.get(compId)?.has(dataProvider)) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            if (!context.contentStore.dataProviderMetaData.get(compId)?.has(dataProvider)) {
                fetchReq.includeMetaData = true;
            }
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        }
    },[])
}
export default useFetchMissingData