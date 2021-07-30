/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { createCloseScreenRequest, createOpenScreenRequest, createSetScreenParameterRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { BaseMenuButton } from "./response";
import AppSettings from "./AppSettings";
import { CustomToolbarItem } from "./customTypes";
import { History } from "history";

/** Contains the API functions */
class API {
    /** Server instance */
    #server:Server;
    /** Contentstore instance */
    #contentStore:ContentStore
    /** AppSettings instance */
    #appSettings:AppSettings
    /** the react routers history object */
    history?:History<any>;


    /**
     * @constructor constructs api instance
     * @param server - server instance
     */
    constructor (server: Server, store:ContentStore, appSettings:AppSettings, history?:History<any>) {
        this.#server = server;
        this.#contentStore = store;
        this.#appSettings = appSettings;
        this.history = history;
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

    getToolbarItems() {
        return [...this.#contentStore.toolbarItems]
    }

    setToolbarItems(toolBarItems: Array<BaseMenuButton>) {
        toolBarItems.forEach(item => {
            if (item.action === undefined) {
                item.action = () => {
                    this.history?.push("/home/"+item.componentId);
                    return Promise.resolve(true);
                }
            }
        })
        this.#contentStore.toolbarItems = toolBarItems;
        this.#contentStore.subManager.emitToolBarUpdate();
    }

    addToolbarItem(toolbarItem: CustomToolbarItem | Array<CustomToolbarItem>) {
        if (Array.isArray(toolbarItem)) {
            toolbarItem.forEach(item => {
                const itemAction = () => {
                    const openReq = createOpenScreenRequest();
                    openReq.componentId = item.screenName;
                    return this.#server.sendRequest(openReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
                }
                this.#contentStore.addToolbarItem({ componentId: item.screenName, text: item.title, image: item.image.includes("fa") ? "fa " + item.image : "pi " + item.image, action: itemAction })
            })
        }
        else {
            const itemAction = () => {
                const openReq = createOpenScreenRequest();
                openReq.componentId = toolbarItem.screenName;
                return this.#server.sendRequest(openReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
            }
            const newItem: BaseMenuButton = { componentId: toolbarItem.screenName, text: toolbarItem.title, image: toolbarItem.image, action: itemAction }
            this.#contentStore.addToolbarItem(newItem);
        }
        this.#contentStore.subManager.emitToolBarUpdate();
    }
}
export default API