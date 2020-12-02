import { createFetchRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

export function sendMapFetchRequests(groupDataProvider:string, pointDataProvider:string, server:any) {
    const sendFetchRequest = (dataProvider:string) => {
        const fetchReq = createFetchRequest();
        fetchReq.dataProvider = dataProvider;
        fetchReq.fromRow = 0;
        server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
    }
    sendFetchRequest(groupDataProvider);
    sendFetchRequest(pointDataProvider);
}