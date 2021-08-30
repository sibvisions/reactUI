import { createFocusGainedRequest, createFocusLostRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import Server from "../../Server";

export function onFocusGained(componentId: string, server: Server) {
    const focusGainedReq = createFocusGainedRequest();
    focusGainedReq.componentId = componentId;
    return server.sendRequest(focusGainedReq, REQUEST_ENDPOINTS.FOCUS_GAINED, undefined, undefined, true);
}

export function onFocusLost(componentId: string, server: Server) {
    const focusLostReq = createFocusLostRequest();
    focusLostReq.componentId = componentId;
    return server.sendRequest(focusLostReq, REQUEST_ENDPOINTS.FOCUS_LOST, undefined, undefined, true);
}