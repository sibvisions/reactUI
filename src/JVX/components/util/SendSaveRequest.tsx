import { createSaveRequest } from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import Server from "../../Server";

export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server) {
    const req = createSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    server.sendRequest(req, REQUEST_ENDPOINTS.SAVE);
}