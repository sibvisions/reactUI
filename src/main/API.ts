/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { createCloseScreenRequest, createSetScreenParameterRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";

/** Contains the API functions */
class API {
    /** Server instance */
    #server:Server;
    /** Contentstore instance */
    #contentStore:ContentStore

    /**
     * @constructor constructs api instance
     * @param server - server instance
     */
    constructor (server: Server, store:ContentStore) {
        this.#server = server
        this.#contentStore = store
    }

    /**
     * Sends screen-parameters for the given screen to the server.
     * @param screenName - the screen-name
     * @param parameter - the screen-parameters
     */
    sendScreenParameter(screenName: string, parameter: { [key: string]: any }) {
        const parameterReq = createSetScreenParameterRequest();
        parameterReq.componentId = screenName;
        parameterReq.parameter = parameter;
        this.#server.sendRequest(parameterReq, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER);
    }

    /**
     * Sends a closeScreenRequest to the server for the given screen.
     * @param screenName - the screen to be closed
     */
    sendCloseScreen(screenName: string) {
        const csRequest = createCloseScreenRequest();
        csRequest.componentId = screenName;
        if (this.#contentStore.closeScreenParameters.has(screenName)) {
            csRequest.parameter = this.#contentStore.closeScreenParameters.get(screenName);
        }
        //TODO topbar
        this.#server.sendRequest(csRequest, REQUEST_ENDPOINTS.CLOSE_SCREEN);
        this.#contentStore.closeScreen(screenName);
    }
}
export default API