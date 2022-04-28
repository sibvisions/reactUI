import { createDALSaveRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import Server from "../../Server";
import ServerV2 from "../../server/ServerV2";

/**
 * Sends a saveRequest to the server
 * @param dataProvider - the dataprovider
 * @param onlySelected - onlyselected
 * @param server - server instance
 */
export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server|ServerV2) {
    const req = createDALSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    return server.sendRequest(req, REQUEST_KEYWORDS.DAL_SAVE);
}