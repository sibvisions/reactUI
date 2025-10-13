/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { History } from "history";
import _ from "underscore";
import API from "../API";
import AppSettings from "../AppSettings";
import BaseContentStore, { IDataBook } from "../contentstore/BaseContentStore";
import ContentStore from "../contentstore/ContentStore";
import ContentStoreFull from "../contentstore/ContentStoreFull";
import { createAliveRequest, createFetchRequest, getClientId } from "../factories/RequestFactory";
import TreePath from "../model/TreePath";
import { SubscriptionManager } from "../SubscriptionManager";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import CloseScreenResponse from "../response/ui/CloseScreenResponse";
import BaseResponse from "../response/BaseResponse";
import RESPONSE_NAMES from "../response/RESPONSE_NAMES";
import ApplicationMetaDataResponse from "../response/app/ApplicationMetaDataResponse";
import FetchResponse from "../response/data/FetchResponse";
import DataProviderChangedResponse from "../response/data/DataProviderChangedResponse";
import { IPanel } from "../components/panels/panel/UIPanel";
import MetaDataResponse from "../response/data/MetaDataResponse";
import SessionExpiredResponse from "../response/error/SessionExpiredResponse";
import DeviceStatusResponse from "../response/event/DeviceStatusResponse";
import { translation } from "../util/other-util/Translation";
import { generateDisplayMapKey, getExtractedObject, ICellEditorLinked } from "../components/editors/linked/UIEditorLinked";
import BadClientResponse from "../response/error/BadClientResponse";
import { indexOfEnd } from "../util/string-util/IndexOfEnd";
import { setDateLocale } from "../util/other-util/GetDateLocale";
import BaseRequest from "../request/BaseRequest";
import DataProviderRequest from "../request/data/DataProviderRequest";
import { CellFormatting } from "../components/table/CellEditor";
import { getMetaData, getPrimaryKeys } from "../util/data-util/GetMetaData";
import GenericResponse from "../response/ui/GenericResponse";
import { TopBarContextType, showTopBar } from "../components/topbar/TopBar";
import IBaseComponent from "../util/types/IBaseComponent";
import { toPageKey } from "../components/tree/UITreeV2";
import { asList } from "../util/string-util/SplitWithQuote";

/** An enum to know which type of request queue is currently active for the request */
export enum RequestQueueMode {
    QUEUE = "queue",
    IMMEDIATE = "immediate"
}

/** Contains functions to handle responses and sendRequest which are used by both transfer modes */
export default abstract class BaseServer {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    /** SubscriptionManager instance */
    subManager:SubscriptionManager;
    
    /** AppSettings instance */
    appSettings:AppSettings;
    
    /** the react routers history object */
    history?:History;
    
    /** a map of still open requests */
    openRequests: Map<any, Promise<any>>;

    /** API instance */
    api:API;

    /** Base url for requests */
    BASE_URL = "";

    /** Resource url for receiving images etc. */
    RESOURCE_URL = "";

    /** the navigation.userAgentData as json. */
    navUserAgentData?:string;

    /** the request queue */
    requestQueue: { request:BaseRequest, endpoint: string, reqFunc: Function}[] = [];

    /** flag if a request is in progress */
    requestInProgress = false;

    /** An array of dataproviders on which dataproviders data is missing and needs to be fetched */
    missingDataFetches:string[] = [];

    /** How long before a timeout occurs */
    timeoutMs = 10000;

    /** True, if an error is currently displayed */
    errorIsDisplayed: boolean = false;

    /** True, if the translation has been fetched */
    translationFetched: boolean = false;

    /** True, if the css-designer translation has been fetched */
    cssDesignerTranslationFetched: boolean = false;

    /** True, if UIRefresh is currently in progress */
    uiRefreshInProgress: boolean = false;

    /** A login-error message or undefined if there is no error */
    loginError:string|undefined = undefined

    /** True, if preserve on reload is activated */
    preserveOnReload:boolean = false;

    /** The interval of sending alive-requests to the server in ms */
    aliveInterval:number = 30000;

    /** The interval of sending "ping" to the server via the websocket in ms */
    wsPingInterval:number = 10000;

    /** A Timestamp to know when the last request was sent (helper for alive interval) */
    lastRequestTimeStamp: number = Date.now();

    /** The navigation-name of a screen if the app was directly launched by a link */
    linkOpen = "";

    /** The URL where the CSS-Files, which are being created bei the CSS-designer, should be uploaded to */
    designerUrl = "";

    /** If true, automatically restart the application on session expired */
    autoRestartOnSessionExpired = false;

    /** True, if the application is currently exiting */
    isExiting = false;

    /** Instance of the topbar (progressbar) */
    topbar: TopBarContextType|undefined;

    /** Possibly open this screen, when another screen is closed or undefined if no screen should be opened. (Screenhistory closing screens -> open screen before) */
    maybeOpenScreen:{ className: string, componentId: string }|undefined = undefined;

    /** A list of screens which haven't yet been closed by the server but are closed client-side. A closeScreen request still needs to be sent to the server. */
    screensToClose:{windowId: string, windowName: string, closeDirectly: boolean|undefined}[] = [];

    /** True, if the home properties should be ignored in the screen generic response */
    ignoreHome = false;

    /** True, if the home button was recently pressed */
    homeButtonPressed = false;

    /** Databooks which need to be deleted because they're in a content which was closed */
    contentDataBooksToDelete: Map<string, string[]> = new Map<string, string[]>();

    // True if the screen has been opened by history close
    openedByClose = false;

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     * @param subManager - subscription-manager instance
     * @param history - the history
     */
     constructor(store: ContentStore|ContentStoreFull, subManager:SubscriptionManager, appSettings:AppSettings, history?: History) {
        this.contentStore = store;
        this.subManager = subManager;
        this.appSettings = appSettings;
        this.history = history;
        this.openRequests = new Map<any, Promise<any>>();
        this.api = new API(this, store, appSettings, subManager, history);
    }

    /** Sets the api of the server instance */
    setAPI(api:API) {
        this.api = api;
    }

    /**
     * Returns true, if the component exists in the flat-content of the contentstore
     * @param name - the name of the component
     */
    abstract componentExists(name:string): boolean;

    /**
     * Builds a request to send to the server
     * @param request - the request to send
     * @returns - a request to send to the server
     */
     buildReqOpts(request:any, additionalHeaders?:boolean):RequestInit {
        let headers: Record<string, string> = {}

        if (additionalHeaders) {
            const touchPoints = typeof navigator !== "undefined" && 'maxTouchPoints' in navigator && typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0;
            const touchStart = 'ontouchstart' in window ? true : false;

            headers["X-maxTouchPoints"] = String(touchPoints);
            headers["X-touchStart"] = String(touchStart);

            if (typeof navigator !== "undefined") {
                if ('userAgent' in navigator) {
                    headers["X-Navigator-UA"] = navigator.userAgent;
                }

                if ('platform' in navigator) {
                    headers["X-Platform"] = navigator?.platform;
                }

                if (this.navUserAgentData != null){
                    headers["X-userAgentData"] = this.navUserAgentData;
                }
            }
        }

        if (request && request.upload) {
            return {
                method: 'POST',
                headers,
                body: request.formData,
                credentials:"include",
            };
        }
        else {
            return {
                method: 'POST',
                headers,
                body: JSON.stringify(request),
                credentials:"include",
            };
        }
    }

    /** ----------SENDING-REQUESTS---------- */

    /** A Map which has a simplified the endpoints names as keys and the actual endpoint as value */
    abstract endpointMap:Map<string, string>;

    /**
     * Sends a request to the server and handles its response.
     * Handles requests in a queue system
     * @param request - the request to send
     * @param endpoint - the endpoint to send the request to
     * @param waitForOpenRequests - if true the request result waits until all currently open immediate requests are finished as well
     * @param queueMode - controls how the request is dispatched
     * @param handleResponse - true, if the response should be handled
     *  - RequestQueueMode.QUEUE: default, requests are sent one after another
     *  - RequestQueueMode.IMMEDIATE: request is sent immediately
     */
     sendRequest(
        request: any, 
        endpoint: string, 
        waitForOpenRequests?: boolean,
        queueMode: RequestQueueMode = RequestQueueMode.QUEUE,
        handleResponse: boolean = true
    ) {
        let promise = new Promise<any>((resolve, reject) => {
            // If the component/dataproviders don't exist or an error is displayed, don't send the request
            if (
                request.componentId 
                && endpoint !== REQUEST_KEYWORDS.OPEN_SCREEN 
                && endpoint !== REQUEST_KEYWORDS.CLOSE_FRAME 
                && endpoint !== REQUEST_KEYWORDS.CLOSE_SCREEN
                && endpoint !== REQUEST_KEYWORDS.CREATE_NEW_COMPONENT
                && !(endpoint !== REQUEST_KEYWORDS.SET_LAYOUT || request.componentId.startsWith("new_"))
                && !this.componentExists(request.componentId)
            ) {
                reject("Component doesn't exist: " + request.componentId);
                return;
            }

            if (request.dataProvider) {
                if (!request.ignoreValidation) {
                    if (Array.isArray(request.dataProvider)) {
                        let exist = true;
                        request.dataProvider.forEach((dataProvider:string) => {
                            const screenName = this.getScreenName(dataProvider);
                            // If the dataprovider doesn't exist yet and it is not under the missingdatafetches array. It doesn't exist and the request is not to be sent
                            if (!this.contentStore.dataBooks.get(screenName)?.has(dataProvider) && !this.missingDataFetches.includes(dataProvider)) {
                                exist = false;
                            }
                        });

                        if (!exist) {
                            reject("Dataproviders don't exist: " + request.dataProvider);
                            return
                        }
                    }
                    else {
                        if (this.appSettings.transferType !== "full") {
                            const splitDataProvider = request.dataProvider.split("/");
                            if (splitDataProvider.length > 1) {
                                // Contents are saved under the "main" screen (dataProvider.split("/")[1]) but to check if a content is opened we have to get the name differently.
                                const dataProviderScreenName = this.getScreenName(request.dataProvider);
                                const activeScreenName = request.screenName ? request.screenName : splitDataProvider[splitDataProvider.length - 2];
                                // Check if the screen is open
                                const screenIsOpen = this.contentStore.activeScreens.some(as => {
                                    const acitveScreenComponent = this.contentStore.getComponentById(as.id);
                                    if (acitveScreenComponent) {
                                        if ((acitveScreenComponent as IPanel).content_modal_) {
                                            return as.name === activeScreenName;
                                        }
                                        else {
                                            return as.name === dataProviderScreenName;
                                        }
                                    }
                                });
                                // Not sending dataprovider request if the screen isnt opened
                                if (!screenIsOpen && this.missingDataFetches.includes(request.dataProvider)) {
                                    this.missingDataFetches.splice(this.missingDataFetches.indexOf(request.dataProvider), 1);
                                    reject("Screen is not open: " + activeScreenName)
                                    return
                                }
            
                                // If the dataprovider doesn't exist yet and it is not under the missingdatafetches array 
                                // it doesn't exist and the request is not to be sent unless is a Filter Request
                                if (
                                    endpoint != REQUEST_KEYWORDS.FILTER &&
                                    !this.contentStore.dataBooks.get(dataProviderScreenName)?.has(request.dataProvider) && 
                                    !this.missingDataFetches.includes(request.dataProvider)
                                ) {
                                    reject("Dataprovider doesn't exist: " + request.dataProvider);
                                    return
                                }
                            }
                        }
                    }
                }
            }

            if (this.errorIsDisplayed && endpoint !== REQUEST_KEYWORDS.ALIVE) {
                reject("Not sending request while an error is active");
                return;
            }

            if (this.isExiting) {
                reject("Server is currently exiting old application");
                return
            }

            if (queueMode === RequestQueueMode.IMMEDIATE) {
                // There are possibly more than one endpoint because of the different transferTypes, so get the correct one from the endpointmap with the request keyword (endpoint parameter)
                let finalEndpoint = this.endpointMap.get(endpoint);

                if (endpoint === REQUEST_KEYWORDS.UI_REFRESH) {
                    this.uiRefreshInProgress = true;
                }
                else if (endpoint === REQUEST_KEYWORDS.LOGIN) {
                    this.subManager.emitLoginActive(true);
                }

                if (!request.clientId && endpoint !== REQUEST_KEYWORDS.STARTUP) {
                    request.clientId = getClientId();
                }
                
                // Update filter because with slow connection filter values were wrong
                if (endpoint === REQUEST_KEYWORDS.SELECT_ROW && request.dataProvider) {
                    const dataBook = this.contentStore.getDataBook(this.getScreenName(request.dataProvider), request.dataProvider);
                    if (dataBook) {
                        const data = dataBook.data?.get("current");
                        const metaData = dataBook.metaData;
                        if (data && metaData && request.rowNumber >= 0) {
                            const primaryKeys = getPrimaryKeys(metaData);
                            request.filter = {
                                columnNames: primaryKeys,
                                values: primaryKeys.map(pk => data[request.rowNumber][pk])
                            }
                        }
                    }
                }
                
                let fetchWithNavData:Promise<any> | undefined = undefined;
                let headers: Record<string, string> | undefined = undefined;
                let additionalHeaders:boolean = endpoint === REQUEST_KEYWORDS.STARTUP;

                if (additionalHeaders) {
                    //highentryprop values are async, so we send startup after result

                    if (typeof navigator !== "undefined" && 'userAgentData' in navigator) {
                        const uData = (navigator as any).userAgentData;

                        //low prop values
                        this.navUserAgentData = JSON.stringify(uData);

                        //high prop values
                        if (uData && typeof uData.getHighEntropyValues === "function") {
                            fetchWithNavData = uData.getHighEntropyValues(['platform', 'platformVersion', 'architecture', 'model', 'uaFullVersion', 'bitness', 'formFactor', 'fullVersionList'])
                            .then((data:any) => { 
                                this.navUserAgentData = JSON.stringify(data); 

                                return fetch(this.BASE_URL + finalEndpoint, this.buildReqOpts(request, true))
                            })
                            .catch((error:any) => { return fetch(this.BASE_URL + finalEndpoint, this.buildReqOpts(request, true))});
                        }
                    }
                } 

                this.lastRequestTimeStamp = Date.now();
                this.timeoutRequest(
                    fetchWithNavData ? fetchWithNavData : fetch(this.BASE_URL + finalEndpoint, this.buildReqOpts(request, additionalHeaders)), 
                    this.timeoutMs, 
                    () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE, handleResponse), finalEndpoint
                )
                    .then((response: any) => response.headers.get("content-type") === "application/json" ? response.json() : Promise.reject("no valid json"))
                    .then(result => {
                        if (result.code) {
                            // If error reject
                            if (400 <= result.code && result.code <= 599) {
                                return Promise.reject(result.code + " " + result.reasonPhrase + ". " + result.description);
                            }
                        }
                        return result;
                    }, (err) => Promise.reject(err))
                    .then((results) => handleResponse ? this.responseHandler.bind(this)(results, request) : results, (err) => Promise.reject(err))
                    .then(results => {
                        if (endpoint === REQUEST_KEYWORDS.LOGIN) {
                            this.subManager.emitLoginActive(false);
                        }
                        return results;
                    })
                    .then(results => {
                        resolve(results)
                    }, (err) => Promise.reject(err))
                    .catch(error => {
                        // Display various possible errors
                        if (typeof error === "string") {
                            const splitErr = error.split(".");
                            const code = error.substring(0, 3);
                            if (code === "410") {
                                this.subManager.emitErrorBarProperties(false, true, false, 5, splitErr[0], splitErr[1]);
                            }
                            else if (error === "no valid json") {
                                if (endpoint === REQUEST_KEYWORDS.STARTUP) {
                                    this.subManager.emitErrorBarProperties(false, false, false, 7, translation.get("Startup failed!"), translation.get("Check if the server is available"), () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE))
                                }
                                else {
                                    this.subManager.emitErrorBarProperties(false, false, false, 5, translation.get("Error occured!"), translation.get("Check the console for more info"), () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE));
                                }
                            }
                            else {
                                this.subManager.emitErrorBarProperties(false, false, false, 5,  splitErr[0], splitErr[1], () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE));
                            }
                        }
                        else {
                            if (endpoint === REQUEST_KEYWORDS.STARTUP) {
                                this.subManager.emitErrorBarProperties(false, false, false, 7, translation.get("Startup failed!"), translation.get("Check if the server is available"), () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE))
                            }
                            else {
                                this.subManager.emitErrorBarProperties(false, false, false, 5, translation.get("Error occured!"), translation.get("Check the console for more info"), () => this.sendRequest(request, endpoint, waitForOpenRequests, RequestQueueMode.IMMEDIATE));
                            }
                        }
                        this.subManager.emitErrorBarVisible(true);
                        reject(error);
                        console.error(error);
                    }).finally(() => {
                        if (this.uiRefreshInProgress) {
                            this.uiRefreshInProgress = false;
                        }

                        // If there are designerCreatedComponents, the server will now know of them, so we can destroy them
                        if (endpoint === REQUEST_KEYWORDS.SET_LAYOUT) {
                            const componentsToDestroy:IBaseComponent[] = this.contentStore.designerCreatedComponents.map((compName: string) => { return { id: compName, "~destroy": true } as IBaseComponent });
                            this.contentStore.designerCreatedComponents = [];
                            this.contentStore.updateContent(componentsToDestroy, false);
                        }

                        this.openRequests.delete(request);
                    });
            } 
            else {
                // If the RequestMode is Queue, add the request to the queue and advance the queue
                this.requestQueue.push({
                    request: request,
                    endpoint: endpoint,
                    reqFunc: () => this.sendRequest(
                        request,
                        endpoint,
                        waitForOpenRequests,
                        RequestQueueMode.IMMEDIATE,
                        handleResponse
                    ).then(results => {
                        resolve(results)
                    }).catch(() => resolve(null))
                })
                this.advanceRequestQueue();
            }
        })

        if (queueMode === RequestQueueMode.IMMEDIATE) {
            if (waitForOpenRequests && this.openRequests.size) {
                const singlePromise = promise;
                promise = Promise.all(this.openRequests.values()).then(() => singlePromise);
                this.openRequests.set(request, promise);
            } else {
                this.openRequests.set(request, promise);
            }
        }

        return promise;
    }

    /** Advances the request queue if there is no request in progress */
    advanceRequestQueue() {
        if(!this.requestInProgress) {
            const request = this.requestQueue.shift()?.reqFunc;
            if (request) {
                this.requestInProgress = true;
                request().catch(() => {}).finally(() => {
                    this.requestInProgress = false;
                    this.advanceRequestQueue();
                });
            }
        }
    }

    /**
     * Returns a promise which times out and throws an error and displays dialog after given ms
     * @param promise - the promise
     * @param ms - the ms to wait before a timeout
     */
    timeoutRequest(promise: Promise<any>, ms: number, retry?:Function, endpoint?:string) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                this.subManager.emitErrorBarProperties(false, false, false, 6, translation.get("Server error!"), translation.get("Timeout! Couldn't connect to the server."), retry);
                this.subManager.emitErrorBarVisible(true);
                reject(new Error("timeOut"))
            }, ms);

            promise.then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.subManager.emitErrorBarProperties(false, false, false, 6, translation.get("Server error!"), translation.get("Timeout! Couldn't connect to the server."), retry);
                    this.subManager.emitErrorBarVisible(true);
                    clearTimeout(timeoutId);
                    reject(err);
            });
        });
    }

    /** ----------HANDLING-RESPONSES---------- */

    /** Handles a closeScreen response sent by the server */
    abstract closeScreen(closeScreenData: CloseScreenResponse, request?: any):void

    /** A Map which checks which function needs to be called when a data response is received (before regular response map) */
    abstract dataResponseMap: Map<string, Function>;

    /** A Map which checks which function needs to be called when a response is received */
    abstract responseMap: Map<string, Function>;

    /** Calls the correct function based on the responses */
    async responseHandler(responses: Array<BaseResponse>, request:any) {
        // If there is a DataProviderChanged response move it to the start of the responses array
        // to prevent flickering of components.
        if (Array.isArray(responses) && responses.length) {
            let contentId:string|undefined = undefined;
            responses.sort((a, b) => {
                if ((a.name === RESPONSE_NAMES.CONTENT || b.name === RESPONSE_NAMES.CONTENT) && !contentId) {
                    const castedResponse = a.name === RESPONSE_NAMES.CONTENT ? a as GenericResponse : b as GenericResponse;
                    if (castedResponse.changedComponents.length && (castedResponse.changedComponents[0] as IPanel).content_className_) {
                        contentId = (castedResponse.changedComponents[0] as IPanel).name;
                    }
                }

                if (a.name === RESPONSE_NAMES.CLOSE_SCREEN && b.name !== RESPONSE_NAMES.CLOSE_SCREEN) {
                    return -1;
                }
                else if (b.name === RESPONSE_NAMES.CLOSE_SCREEN && a.name !== RESPONSE_NAMES.CLOSE_SCREEN) {
                    return 1;
                }
                else if (a.name === RESPONSE_NAMES.DAL_META_DATA && (b.name !== RESPONSE_NAMES.DAL_META_DATA && b.name !== RESPONSE_NAMES.CLOSE_SCREEN)) {
                    return -1
                }
                else if (b.name === RESPONSE_NAMES.DAL_META_DATA && (a.name !== RESPONSE_NAMES.DAL_META_DATA && a.name !== RESPONSE_NAMES.CLOSE_SCREEN)) {
                    return 1
                }
                else {
                    return 0;
                }
            });

            for (const [, response] of responses.entries()) {
                // If there is a content add the databook to the array so it will be deleted later
                if (response.name === RESPONSE_NAMES.DAL_META_DATA && contentId) {
                    const castedResponse = response as MetaDataResponse;
                    if (!this.contentDataBooksToDelete.has(contentId)) {
                        this.contentDataBooksToDelete.set(contentId, [castedResponse.dataProvider])
                    }
                    else {
                        this.contentDataBooksToDelete.get(contentId)!.push(castedResponse.dataProvider);
                    }
                }
                let mapper = this.dataResponseMap.get(response.name);
                if (mapper) {
                    await mapper(response, request);
                }

                mapper = this.responseMap.get(response.name);
                if (mapper) {
                    await mapper(response, request);
                }
            }
        }
        return responses;
    }

    /**
     * Sets the clientId in the sessionStorage and sets application-settings
     * @param metaData - the applicationMetaDataResponse
     */
     applicationMetaData(metaData: ApplicationMetaDataResponse) {
        sessionStorage.setItem("clientId", metaData.clientId);
        this.RESOURCE_URL = this.BASE_URL + "/resource/" + metaData.applicationName;
        this.preserveOnReload = metaData.preserveOnReload;

        if (metaData.aliveInterval !== undefined) {
            this.aliveInterval = metaData.aliveInterval;
        }

        if (metaData.wsPingInterval !== undefined) {
            this.wsPingInterval = metaData.wsPingInterval;
        }

        this.appSettings.setMenuOptions(undefined, undefined, undefined, undefined, metaData.userRestart, metaData.foldMenuOnCollapse);

        this.appSettings.setApplicationMetaData(metaData);

        if (metaData.langCode) {
            this.appSettings.locale = metaData.langCode;
            setDateLocale(metaData.langCode);
        }
    }

    /**
     * Returns the current screen-name
     * @param dataProvider - the dataprovider
     * @returns 
     */
    abstract getScreenName(dataProvider:string): string;

    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
     processRowSelection(selectedRowIndex: number|undefined, dataProvider: string, treePath?:TreePath, selectedColumn?:string) {
        const screenName = this.getScreenName(dataProvider);
        // If there is a selectedRow index, set it
        if(selectedRowIndex !== -1 && selectedRowIndex !== -0x80000000 && selectedRowIndex !== undefined) {
            /** The data of the row */
            const selectedRow = this.contentStore.getDataRow(screenName, dataProvider, selectedRowIndex);
            if (!selectedRow) {
                // If there is no selectedRow in the databook, fetch it and set it
                const dataBook = this.contentStore.dataBooks.get(screenName)?.get(dataProvider);
                if (dataBook && dataBook.data && dataBook.data.get("current")) {
                    const length = dataBook.data.get("current").length;
                    const fetchReq = createFetchRequest();
                    fetchReq.fromRow = length;
                    fetchReq.rowCount = (selectedRowIndex - length) + 1;
                    fetchReq.dataProvider = dataProvider;
                    showTopBar(this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH).then((res) => {
                        const newSelectedRow = this.contentStore.getDataRow(screenName, dataProvider, selectedRowIndex);
                        this.contentStore.setSelectedRow(screenName, dataProvider, newSelectedRow, selectedRowIndex, treePath, selectedColumn);
                    }), this.topbar as TopBarContextType); 
                }
            }
            else {
                this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, selectedRowIndex, treePath, selectedColumn);
            }
        }
        // If there is no selected row, check if there is a treepath and set the last index of it or deselect the current selected row
        else if(selectedRowIndex === -1) {
            if (treePath !== undefined && treePath.length() > 0) {
                const selectedRow = this.contentStore.getDataRow(screenName, dataProvider, treePath.getLast());
                this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, treePath.getLast(), treePath.getParentPath(), selectedColumn)
            }
            else {
                //this.contentStore.clearSelectedRow(screenName, dataProvider);
                this.contentStore.setSelectedRow(screenName, dataProvider, {}, -1, undefined, selectedColumn)
            }
        }
        // If there is no new selectedRowIndex but a column is selected, get the old selectedRowIndex and add the selectedColumn
        else if (selectedRowIndex === undefined && selectedColumn !== undefined) {
            if(this.contentStore.getDataBook(screenName, dataProvider)?.selectedRow) {
                const selectedRow = this.contentStore.getDataBook(screenName, dataProvider)!.selectedRow!.dataRow;
                const idx = this.contentStore.getDataBook(screenName, dataProvider)!.selectedRow!.index;
                this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, idx, treePath, selectedColumn);
            }
        }
    }

    /**
     * Returns the data as array with objects of the columnnames and data merged together
     * @param fetchData - the fetchResponse received
     * @returns the data as array with objects of the columnnames and data merged together
     */
     buildDatasets(fetchData: FetchResponse) {
        //if there are recordformats parse & transform them so that we can map them on a row basis
        const formattedRecords: Record<string, any>[] = [];
        if (fetchData.recordFormat) {
            for (const componentId in fetchData.recordFormat) {
                const entry = fetchData.recordFormat[componentId];
                const styleKeys = ['background', 'foreground', 'font', 'image', 'style', 'leftIndent'];
                const format = entry.format.map(f => f ? asList(f).reduce((agg, v, i) => v ? {...agg, [styleKeys[i]]: v} : agg, {}) : f);

                entry.records.forEach((record, index) => {
                    if (record.length === 1 && record[0] === -1) {
                        return;
                    }
                    formattedRecords[index] = formattedRecords[index] || {};
                    formattedRecords[index][componentId] = new Map<String, CellFormatting>();

                    for (let colIndex = 0; colIndex < record.length; colIndex++) {
                        formattedRecords[index][componentId].set(fetchData.columnNames[colIndex], format[Math.max(0, Math.min(record[colIndex], format.length - 1))]);

                        if (colIndex === record.length - 1 && fetchData.columnNames.length > record.length) {
                            for (let j = colIndex; j < fetchData.columnNames.length; j++) {
                                formattedRecords[index][componentId].set(fetchData.columnNames[j], format[Math.max(0, Math.min(record[colIndex], format.length - 1))]);
                            }
                        }
                    }
                });
            }
        }

        /** If some records (cells) are readonly parse the data */
        const readOnlyRecords: Record<string, any>[] = [];
        if (fetchData.recordReadOnly) {
            fetchData.recordReadOnly.records.forEach((readOnlyArray, index) => {
                readOnlyRecords[index + fetchData.from] = new Map<string, number>();
                for (let i = 0; i < readOnlyArray.length; i++) {
                    readOnlyRecords[index + fetchData.from].set(fetchData.columnNames[i], readOnlyArray[i]);

                    if (i === readOnlyArray.length - 1 && fetchData.columnNames.length > readOnlyArray.length) {
                        for (let j = i; j < fetchData.columnNames.length; j++) {
                            readOnlyRecords[index + fetchData.from].set(fetchData.columnNames[j], readOnlyArray[readOnlyArray.length - 1]);
                        }
                    }
                };
            })
        }
        
        return fetchData.records.map((record, index) => {
            const data : any = {
                __recordFormats: formattedRecords[index],
                __recordReadOnly: readOnlyRecords[index]
            }
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            data.recordStatus = record[Object.keys(record).length-1]
            return data;
        });
    }

    /**
     * Builds a dataToDisplay Map for LinkedCellEditors, based on the LinkReference and the data
     * @param screenName - the screenName
     * @param column - the columnDefinition
     * @param dataArray - the data
     * @param dataBook - the databook
     * @param dataProvider - the dataprovider name
     */
    buildDataToDisplayMap(screenName:string, column: any, dataArray:any[], dataBook:IDataBook, dataProvider:string) {
        let dataToDisplayMap = new Map<string, string>();
        const cellEditor = column.cellEditor as ICellEditorLinked;
        // edit if available
        if (cellEditor.linkReference.dataToDisplayMap) {
            dataToDisplayMap = cellEditor.linkReference.dataToDisplayMap
        }
        let notifyDataMap = false;

        // If there are no columnNames set in the columnNames of linkReference, add the bound columnName
        if (!cellEditor.linkReference.columnNames.length) {
            cellEditor.linkReference.columnNames.push(column.columnName)
        }

        // Get the index for the correct column from the columnNames to find it in the referencedColumnNames
        const index = cellEditor.linkReference.columnNames.findIndex(colName => colName === column.columnName);
        if (dataArray.length && Object.keys(dataArray[0]).includes(cellEditor.linkReference.referencedColumnNames[index])) {
            dataArray.forEach((data) => {
                if (data) {
                    // Create the key for the displayMap based on the data of the datarow and the columns of the linkreference
                    const referencedData = getExtractedObject(data, [cellEditor.linkReference.referencedColumnNames[index]]);
                    const keyObj = generateDisplayMapKey(
                        data,
                        referencedData,
                        cellEditor.linkReference,
                        column.columnName,
                        cellEditor.displayConcatMask || cellEditor.displayReferencedColumnName,
                        cellEditor,
                        "build-map"
                    )
                    // Get the object of the columns which should be displayed from the datarow
                    const columnViewNames = cellEditor.columnView ? cellEditor.columnView.columnNames : dataBook.metaData!.columnView_table_;
                    const columnViewData = getExtractedObject(data, columnViewNames);
                    if (cellEditor.displayReferencedColumnName) {
                        // If there is a displayReferencedColumnName take the key obj as key and the value is the value of this column of the datarow
                        const extractDisplayRef = getExtractedObject(data, [...cellEditor.linkReference.referencedColumnNames, cellEditor.displayReferencedColumnName]);
                        dataToDisplayMap.set(JSON.stringify(keyObj), extractDisplayRef[cellEditor.displayReferencedColumnName as string]);
                        dataToDisplayMap.set(JSON.stringify(referencedData), extractDisplayRef[cellEditor.displayReferencedColumnName as string]);
                        if (!notifyDataMap) {
                            notifyDataMap = true;
                        }
                    }
                    else if (cellEditor.displayConcatMask) {
                        let displayString = "";
                        if (cellEditor.displayConcatMask.includes("*")) {
                            // Replacing "*" in case the actual value which needs to be displayed is "*"
                            displayString = cellEditor.displayConcatMask.replaceAll("*", "[asterisk_xyz]")
                            const count = (cellEditor.displayConcatMask.match(/\*/g) || []).length;
                            // For every "*" in the concatmask append a column from the data of the columnNames
                            for (let i = 0; i < count; i++) {
                                displayString = displayString.replace('[asterisk_xyz]', columnViewData[columnViewNames[i]] !== undefined ? columnViewData[columnViewNames[i]] : "");
                            }
                        }
                        else {
                            // If there are no "*" use every column of columnViewNames
                            columnViewNames.forEach((column, i) => {
                                displayString += columnViewData[column] + (i !== columnViewNames.length - 1 ? cellEditor.displayConcatMask : "");
                            });
                        }
                        // Set/Update the map and set the notify flag in case the subscribers should be notified
                        if (!dataToDisplayMap.has(JSON.stringify(keyObj)) || dataToDisplayMap.get(JSON.stringify(keyObj)) !== displayString) {
                            if (!notifyDataMap) {
                                notifyDataMap = true;
                            }
                            dataToDisplayMap.set(JSON.stringify(keyObj), displayString);
                        }
    
                        if (!dataToDisplayMap.has(JSON.stringify(referencedData)) || dataToDisplayMap.get(JSON.stringify(referencedData)) !== displayString) {
                            if (!notifyDataMap) {
                                notifyDataMap = true;
                            }
                            dataToDisplayMap.set(JSON.stringify(referencedData), displayString);
                        }
                    }
                }  
            });
        }
        
        cellEditor.linkReference.dataToDisplayMap = dataToDisplayMap;
        if (notifyDataMap) {
            this.subManager.notifyLinkedDisplayMapChanged(screenName, dataProvider);
        }
    }

    /**
     * Builds the data and then tells contentStore to update its dataProviderData
     * Also checks if all data of the dataprovider is fetched and sets contentStores dataProviderFetched
     * @param fetchData - the fetchResponse
     * @param request - the request which has been sent to receive this fetch response
     */
     processFetch(fetchData: FetchResponse, request: any) {
        const builtData = this.buildDatasets(fetchData);
        const screenName = this.getScreenName(fetchData.dataProvider);

        if (this.contentStore.getDataBook(screenName, fetchData.dataProvider)) {
            const dataBook = this.contentStore.getDataBook(screenName, fetchData.dataProvider) as IDataBook;
            //dataBook.isAllFetched = fetchData.isAllFetched;

            if (fetchData.clear) {
                dataBook.isAllFetched = undefined;
            }

            if (dataBook.isAllFetched === undefined || fetchData.isAllFetched) {
                dataBook.isAllFetched = fetchData.isAllFetched;
            }
           
            // If there are referencedCellEditors (LinkedCellEditors) build the datatodisplay map
            if (dataBook.metaData) {
                if (dataBook.referencedCellEditors?.length) {
                    dataBook.referencedCellEditors.forEach((column) => {
                        let castedColumn = (this.contentStore.getDataBook(screenName, column.dataBook) as IDataBook).metaData?.columns.find(col => col.name === column.columnName)?.cellEditor as ICellEditorLinked;
                        if (!castedColumn || !castedColumn.linkReference) {
                            castedColumn = column.cellEditor as ICellEditorLinked
                        }
                        this.buildDataToDisplayMap(screenName, column, builtData, dataBook, fetchData.dataProvider)
                    })
                }
            }
        }

        // If there is a detailMapKey, call updateDataProviderData with it
        this.contentStore.updateDataProviderData(
            screenName, 
            fetchData.dataProvider, 
            builtData, 
            fetchData.to, 
            fetchData.from,
            fetchData.isAllFetched,
            fetchData.masterRow,
            fetchData.clear,
            request
        );
        
        this.contentStore.setSortDefinition(screenName, fetchData.dataProvider, fetchData.sortDefinition ? fetchData.sortDefinition : []);

        const selectedColumn = this.contentStore.getDataBook(screenName, fetchData.dataProvider)?.selectedRow?.selectedColumn;
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider, fetchData.treePath ? new TreePath(fetchData.treePath) : undefined, fetchData.selectedColumn ? fetchData.selectedColumn : selectedColumn);

        // If the dataprovider is in fetch-missing-data, remove it
        if (this.missingDataFetches.includes(fetchData.dataProvider)) {
            this.missingDataFetches.splice(this.missingDataFetches.indexOf(fetchData.dataProvider), 1);
        }
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
    processDataProviderChanged(changedProvider: DataProviderChangedResponse) {
        const screenName = this.getScreenName(changedProvider.dataProvider);
        const dataBook = this.contentStore.getDataBook(screenName, changedProvider.dataProvider);

        // If the crud operations changed, update the metadata
        if (changedProvider.insertEnabled !== undefined
            || changedProvider.updateEnabled !== undefined
            || changedProvider.deleteEnabled !== undefined
            || changedProvider.readOnly !== undefined
            || changedProvider.changedColumns !== undefined) {
            this.contentStore.updateMetaData(
                screenName,
                changedProvider.dataProvider,
                changedProvider.insertEnabled,
                changedProvider.updateEnabled,
                changedProvider.deleteEnabled,
                changedProvider.model_insertEnabled,
                changedProvider.model_updateEnabled,
                changedProvider.model_deleteEnabled,
                changedProvider.readOnly,
                changedProvider.changedColumns
            );
        }

        if (changedProvider.recordFormat) {
            if (dataBook?.metaData) {
                const columnNames = dataBook?.metaData.columns.map(col => col.name);
                const formattedRecords: Record<string, any>[] = [];
                for (const componentId in changedProvider.recordFormat) {
                    const entry = changedProvider.recordFormat[componentId];
                    const styleKeys = ['background', 'foreground', 'font', 'image', 'style', 'leftIndent'];
                    const format = entry.format.map(f => f ? asList(f).reduce((agg, v, i) => v ? { ...agg, [styleKeys[i]]: v } : agg, {}) : f);
                    entry.records.forEach((r, index) => {
                        if (r.length === 1 && r[0] === -1) {
                            return;
                        }
                        formattedRecords[index] = formattedRecords[index] || {};
                        formattedRecords[index][componentId] = new Map<String, CellFormatting>();

                        for (let i = 0; i < r.length; i++) {
                            formattedRecords[index][componentId].set(columnNames[i], format[Math.max(0, Math.min(r[i], format.length - 1))]);

                            if (i === r.length - 1 && columnNames.length > r.length) {
                                for (let j = i; j < columnNames.length; j++) {
                                    formattedRecords[index][componentId].set(columnNames[j], format[Math.max(0, Math.min(r[i], format.length - 1))]);
                                }
                            }
                        }
                    });
                }

                if (dataBook.data?.get("current")) {
                    const dataArray: any[] = Array.from(dataBook.data.get("current"));
                    if (dataArray.length >= formattedRecords.length) {
                        formattedRecords.forEach((formattedRecord, i) => {
                            dataArray[i]["__recordFormats"] = formattedRecord;
                        });
                        dataBook.data.set("current", dataArray);
                    }
                }
            }

        }

        if (changedProvider.recordReadOnly) {
            if (dataBook?.metaData) {
                const columnNames = dataBook?.metaData.columns.map(col => col.name);
                const readOnlyRecords: Record<string, any>[] = [];
                changedProvider.recordReadOnly.records.forEach((readOnlyArray, index) => {
                    readOnlyRecords[index] = new Map<string, number>();
                    for (let i = 0; i < readOnlyArray.length; i++) {
                        readOnlyRecords[index].set(columnNames[i], readOnlyArray[i]);

                        if (i === readOnlyArray.length - 1 && columnNames.length > readOnlyArray.length) {
                            for (let j = i; j < columnNames.length; j++) {
                                readOnlyRecords[index].set(columnNames[j], readOnlyArray[readOnlyArray.length - 1]);
                            }
                        }
                    };
                });

                if (dataBook.data?.get("current")) {
                    const dataArray: any[] = Array.from(dataBook.data.get("current"));
                    if (dataArray.length >= readOnlyRecords.length) {
                        readOnlyRecords.forEach((readOnlyRecord, i) => {
                            dataArray[i]["__recordReadOnly"] = readOnlyRecord;
                        });
                        dataBook.data.set("current", dataArray);
                    }
                }
            }
        }

        // If there is a deletedRow, delete it and notify the screens
        if (changedProvider.deletedRow !== undefined) {
            const compPanel = this.contentStore.getComponentByName(screenName) as IPanel;
            const rowToDelete = this.contentStore.getDataRow(screenName, changedProvider.dataProvider, changedProvider.deletedRow);
            if (rowToDelete !== undefined)
            {
                this.contentStore.deleteDataProviderData(screenName, changedProvider.dataProvider, changedProvider.deletedRow);
                this.subManager.notifyDataChange(screenName, changedProvider.dataProvider);
                this.subManager.notifyScreenDataChange(screenName);
                if (dataBook?.metaData && dataBook.metaData.masterReference) {
                    const pageKey = toPageKey({
                        columnNames: dataBook.metaData.masterReference.columnNames,
                        values: dataBook.metaData.masterReference.columnNames.map((colName) => rowToDelete[colName])
                    });
                    const data = dataBook.data?.get(pageKey);
                    this.subManager.notifyTreeDataChanged(changedProvider.dataProvider, data, pageKey)
                }


                if (compPanel && this.contentStore.isPopup(compPanel) && this.contentStore.getScreenDataproviderMap(changedProvider.dataProvider.split('/')[1])) {
                    this.subManager.notifyDataChange(changedProvider.dataProvider.split('/')[1], changedProvider.dataProvider);
                    this.subManager.notifyScreenDataChange(changedProvider.dataProvider.split('/')[1]);
                }
            }
        }

        // Combine changedColumnNames and changedValues and update the dataprovider-data
        if (changedProvider.changedColumnNames !== undefined && changedProvider.changedValues !== undefined && changedProvider.selectedRow !== undefined) {
            const dataRow = this.contentStore.getData(screenName, changedProvider.dataProvider)[changedProvider.selectedRow];
            let changedData: any = _.object(changedProvider.changedColumnNames, changedProvider.changedValues);
            if (dataRow) {
                changedData = { ...dataRow, ...changedData }
            }
            this.contentStore.updateDataProviderData(screenName, changedProvider.dataProvider, [changedData], changedProvider.selectedRow, changedProvider.selectedRow);
            const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
        
        // Reload -1 means refetching the databook
        if (changedProvider.reload === -1) {
            if (!this.contentStore.dataBooks.get(this.getScreenName(changedProvider.dataProvider))?.has(changedProvider.dataProvider) && !this.missingDataFetches.includes(changedProvider.dataProvider)) {
                this.missingDataFetches.push(changedProvider.dataProvider);
            }

            if (this.contentStore.getDataBook(screenName, changedProvider.dataProvider)) {
                dataBook!.isAllFetched = undefined;
            }

            this.contentStore.clearDataFromProvider(screenName, changedProvider.dataProvider);
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = changedProvider.dataProvider; 
            fetchReq.fromRow = 0;
            if (!getMetaData(screenName, changedProvider.dataProvider, this.contentStore)) {
                fetchReq.includeMetaData = true;
            }
            showTopBar(this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, undefined, RequestQueueMode.IMMEDIATE)
                .then(() => {
                    this.requestQueue = this.requestQueue.filter(req => !((req.request as DataProviderRequest).dataProvider === changedProvider.dataProvider) || !(req.endpoint === REQUEST_KEYWORDS.SELECT_ROW));
                }), this.topbar as TopBarContextType);
        }
        else if (changedProvider.reload !== undefined) {
            // Reload at a specific number means reload this specific index of the table
            if (!this.contentStore.dataBooks.get(this.getScreenName(changedProvider.dataProvider))?.has(changedProvider.dataProvider) && !this.missingDataFetches.includes(changedProvider.dataProvider)) {
                this.missingDataFetches.push(changedProvider.dataProvider);
            }
            const fetchReq = createFetchRequest();
            fetchReq.rowCount = 1;
            fetchReq.fromRow = changedProvider.reload;
            fetchReq.dataProvider = changedProvider.dataProvider;
            if (!getMetaData(screenName, changedProvider.dataProvider, this.contentStore)) {
                fetchReq.includeMetaData = true;
            }
            showTopBar(this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, undefined, RequestQueueMode.IMMEDIATE), this.topbar as TopBarContextType);
        }
        else {
            const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn;
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
    }

    /**
     * Checks if some metaData already exists for this screenName and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
     processMetaData(metaData: MetaDataResponse) {
        this.contentStore.setMetaData(this.getScreenName(metaData.dataProvider), metaData);
    }

    /**
     * When the session expires send a new startupRequest to the server like in app and reset the contentStore
     * @param expData - the sessionExpiredResponse
     */
     sessionExpired(expData: SessionExpiredResponse) {
        // If uirefresh or autorestart restart the app
        if (this.uiRefreshInProgress || this.autoRestartOnSessionExpired) {
            // if (this.appSettings.transferType !== "full") {
            //     this.history?.push("/login");
            // }
            if (this.autoRestartOnSessionExpired) {
                console.log("Session Expired! Restarting.")
            }
            this.appSettings.setAppReadyParamFalse();
            this.subManager.emitAppReady(false);
            this.subManager.emitRestart();
            this.isExiting = true;
            this.timeoutRequest(fetch(this.BASE_URL + this.endpointMap.get(REQUEST_KEYWORDS.EXIT), this.buildReqOpts(createAliveRequest())), this.timeoutMs);
            sessionStorage.clear();
        }
        else {
            // display error message
            this.subManager.emitErrorBarProperties(true, false, false, 11, translation.get("Session expired!"));
            this.subManager.emitErrorBarVisible(true);
            this.subManager.emitSessionExpiredChanged(true)
        }
        if (this.history?.location.pathname.includes("/screens/")) {
            localStorage.setItem("restartScreen", this.history.location.pathname.replaceAll("/", "").substring(indexOfEnd(this.history.location.pathname, "screens") - 1));
        }
        console.error(expData.title);
    }

    /**
     * Sets the device-status in app-settings and triggers an event to update the subscribers
     * @param deviceStatus - the device-status response
     */
     deviceStatus(deviceStatus:DeviceStatusResponse) {
        this.appSettings.setDeviceStatus(deviceStatus.layoutMode);
        this.appSettings.setMenuCollapsed(["Small", "Mini"].indexOf(deviceStatus.layoutMode) !== -1);
        this.subManager.emitDeviceMode(deviceStatus.layoutMode);
    }

    /**
     * Displays an error if there is a bad client response
     * @param badClientData - the bad client message
     */
    badClient(badClientData:BadClientResponse) {
        const versionSubstring = badClientData.info.substring(badClientData.info.indexOf("[") + 1, badClientData.info.indexOf("]"));
        const versionSplit = versionSubstring.split("!");
        const clientVersion = versionSplit[0].trim();
        const serverVersion = versionSplit[1].trim();
        this.subManager.emitErrorBarProperties(false, false, true, 12, translation.get("Compatibility issue"), translation.get("The client and server version are incompatible.") + "\n Client: " + clientVersion + " <-> Server: " + serverVersion);
        this.subManager.emitErrorBarVisible(true);
    }
}