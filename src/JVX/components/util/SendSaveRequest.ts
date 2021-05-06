/** Other imports */
import { createSaveRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import Server from "../../Server";

/**
 * Sends a saveRequest to the server
 * @param dataProvider - the dataprovider
 * @param onlySelected - onlyselected
 * @param server - server instance
 */
export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server) {
    const req = createSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    server.sendRequest(req, REQUEST_ENDPOINTS.SAVE);
}