import { createSaveRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import Server from "src/JVX/Server";

export function sendSaveRequest(dataProvider:string, onlySelected:boolean, server:Server) {
    const req = createSaveRequest();
    req.dataProvider = dataProvider;
    req.onlySelected = onlySelected;
    server.sendRequest(req, REQUEST_ENDPOINTS.SAVE);
}