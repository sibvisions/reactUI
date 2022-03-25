import { createFocusGainedRequest, createFocusLostRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import Server from "../../Server";

/**
 * Sends a focus-gained-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusGained(componentId: string, server: Server) {
    const focusGainedReq = createFocusGainedRequest();
    focusGainedReq.componentId = componentId;
    return server.sendRequest(focusGainedReq, REQUEST_KEYWORDS.FOCUS_GAINED, undefined, undefined, true);
}

/**
 * Sends a focus-lost-request to the server
 * @param componentId - the component id to focus
 * @param server - the server-class to send the request
 */
export function onFocusLost(componentId: string, server: Server) {
    const focusLostReq = createFocusLostRequest();
    focusLostReq.componentId = componentId;
    return server.sendRequest(focusLostReq, REQUEST_KEYWORDS.FOCUS_LOST, undefined, undefined, true);
}