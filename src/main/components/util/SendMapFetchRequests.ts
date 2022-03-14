import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";

/**
 * Sends fetch requests, for the groups and points of a map, to the server
 * @param groupDataProvider - the dataprovider of the group databook
 * @param pointDataProvider - the dataprovider of the point databook
 * @param server - server context
 */
export async function sendMapFetchRequests(groupDataProvider:string, pointDataProvider:string, server:any) {
    /** Builds the fetch request */
    const sendFetchRequest = (dataProvider:string) => {
        return new Promise<void>((resolve) => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            fetchReq.fromRow = 0;
            server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH).then(() => resolve());
        })
    }

    if (groupDataProvider) {
        await sendFetchRequest(groupDataProvider);
    }
    
    if (pointDataProvider) {
        await sendFetchRequest(pointDataProvider);
    }
}