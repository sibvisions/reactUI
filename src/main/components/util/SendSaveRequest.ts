import { createDALSaveRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import Server from "../../Server";

/**
 * Sends a saveRequest to the server
 * @param dataProvider - the dataprovider
 * @param onlySelected - onlyselected
 * @param server - server instance
 */
export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server) {
    const req = createDALSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    return server.sendRequest(req, REQUEST_ENDPOINTS.DAL_SAVE);
}