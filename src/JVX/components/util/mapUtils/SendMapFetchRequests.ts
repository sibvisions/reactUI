/** Other imports */
import { createFetchRequest } from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

/**
 * Sends fetch requests, for the groups and points of a map, to the server
 * @param groupDataProvider - the dataprovider of the group databook
 * @param pointDataProvider - the dataprovider of the point databook
 * @param server - server context
 */
export function sendMapFetchRequests(groupDataProvider:string, pointDataProvider:string, server:any) {
    /** Builds the fetch request */
    const sendFetchRequest = (dataProvider:string) => {
        const fetchReq = createFetchRequest();
        fetchReq.dataProvider = dataProvider;
        fetchReq.fromRow = 0;
        server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
    }
    sendFetchRequest(groupDataProvider);
    sendFetchRequest(pointDataProvider);
}