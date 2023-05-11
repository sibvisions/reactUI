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
import { createAliveRequest, createFetchRequest } from "../factories/RequestFactory";
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
import { getExtractedObject, ICellEditorLinked } from "../components/editors/linked/UIEditorLinked";
import BadClientResponse from "../response/error/BadClientResponse";
import { indexOfEnd } from "../util/string-util/IndexOfEnd";
import { setDateLocale } from "../util/other-util/GetDateLocale";
import BaseRequest from "../request/BaseRequest";
import DataProviderRequest from "../request/data/DataProviderRequest";
import GenericResponse from "../response/ui/GenericResponse";

export enum RequestQueueMode {
    QUEUE = "queue",
    IMMEDIATE = "immediate"
}

export default abstract class BaseServer {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreFull;

    /** SubscriptionManager instance */
    subManager:SubscriptionManager;
    
    /** AppSettings instance */
    appSettings:AppSettings;
    
    /** the react routers history object */
    history?:History<any>;
    
    /** a map of still open requests */
    openRequests: Map<any, Promise<any>>;

    /** API instance */
    api:API;

    /** Base url for requests */
    BASE_URL = "";

    /** Resource url for receiving images etc. */
    RESOURCE_URL = "";

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

    designerUrl = "";

    autoRestartOnSessionExpired = false;

    isExiting = false;

    hideTopbar:Function = () => {};

    maybeOpenScreen:string|undefined = undefined;

    screenToClose:{windowName: string, closeContent: boolean|undefined}|undefined = undefined;

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     * @param subManager - subscription-manager instance
     * @param history - the history
     */
     constructor(store: ContentStore|ContentStoreFull, subManager:SubscriptionManager, appSettings:AppSettings, history?: History<any>) {
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
     buildReqOpts(request:any):RequestInit {
        if (request && request.upload) {
            return {
                method: 'POST',
                body: request.formData,
                credentials:"include",
            };
        }
        else {
            return {
                method: 'POST',
                body: JSON.stringify(request),
                credentials:"include",
            };
        }
    }

    /** ----------SENDING-REQUESTS---------- */

    /** A Map which has a simplified the endpoints names as keys and the actual endpoint as value */
    abstract endpointMap:Map<string, string>;

    /**
     * Sends a request to the server and handles its response, if there are jobs in the
     * SubscriptionManagers JobQueue, call them after the response handling is complete.
     * Handles requests in a queue system
     * @param request - the request to send
     * @param endpoint - the endpoint to send the request to
     * @param fn - a function called after the request is completed
     * @param job - if false or not set job queue is cleared
     * @param waitForOpenRequests - if true the request result waits until all currently open immediate requests are finished as well
     * @param queueMode - controls how the request is dispatched
     *  - RequestQueueMode.QUEUE: default, requests are sent one after another
     *  - RequestQueueMode.IMMEDIATE: request is sent immediately
     */
     sendRequest(
        request: any, 
        endpoint: string, 
        fn?: Function[], 
        job?: boolean, 
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
                && !this.componentExists(request.componentId)
            ) {
                reject("Component doesn't exist: " + request.componentId);
                return;
            }
            if (request.dataProvider) {
                if (Array.isArray(request.dataProvider)) {
                    let exist = true;
                    request.dataProvider.forEach((dataProvider:string) => {
                        if (!this.contentStore.dataBooks.get(this.getScreenName(dataProvider))?.has(dataProvider) && !this.missingDataFetches.includes(dataProvider)) {
                            exist = false;
                        }
                    });

                    if (!exist) {
                        reject("Dataproviders don't exist: " + request.dataProvider);
                        return
                    }
                }
                else if (!this.contentStore.dataBooks.get(this.getScreenName(request.dataProvider))?.has(request.dataProvider) && !this.missingDataFetches.includes(request.dataProvider)) {
                    reject("Dataprovider doesn't exist: " + request.dataProvider);
                    return
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
                let finalEndpoint = this.endpointMap.get(endpoint);

                if (endpoint === REQUEST_KEYWORDS.UI_REFRESH) {
                    this.uiRefreshInProgress = true;
                }
                else if (endpoint === REQUEST_KEYWORDS.LOGIN) {
                    this.subManager.emitLoginActive(true);
                }

                this.lastRequestTimeStamp = Date.now();
                this.timeoutRequest(
                    fetch(this.BASE_URL + finalEndpoint, this.buildReqOpts(request)), 
                    this.timeoutMs, 
                    () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, RequestQueueMode.IMMEDIATE, handleResponse)
                )
                    .then((response: any) => response.headers.get("content-type") === "application/json" ? response.json() : Promise.reject("no valid json"))
                    .then(result => {
                        if (result.code) {
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
                        if (fn) {
                            fn.forEach(func => func.apply(undefined, []))
                        }

                        if (!job) {
                            for (let [, value] of this.subManager.jobQueue.entries()) {
                                value();
                            }
                            this.subManager.jobQueue.clear()
                        }
                        return results;
                    })
                    .then(results => {
                        resolve(results)
                    }, (err) => Promise.reject(err))
                    .catch(error => {
                        if (typeof error === "string") {
                            const splitErr = error.split(".");
                            const code = error.substring(0, 3);
                            if (code === "410") {
                                this.subManager.emitErrorBarProperties(false, true, false, 5, splitErr[0], splitErr[1]);
                            }
                            else {
                                this.subManager.emitErrorBarProperties(false, false, false, 5,  splitErr[0], splitErr[1], () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, RequestQueueMode.IMMEDIATE));
                            }
                        }
                        else {
                            if (endpoint === REQUEST_KEYWORDS.STARTUP) {
                                this.subManager.emitErrorBarProperties(false, false, false, 7, "Startup failed!", "Check if the server is available", () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, RequestQueueMode.IMMEDIATE))
                            }
                            else {
                                this.subManager.emitErrorBarProperties(false, false, false, 5, "Error occured!", "Check the console for more info", () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, RequestQueueMode.IMMEDIATE));
                            }
                        }
                        if (error !== "no valid json") {
                            this.subManager.emitErrorBarVisible(true);
                        }
                        reject(error);
                        console.error(error);
                    }).finally(() => {
                        if (this.uiRefreshInProgress) {
                            this.uiRefreshInProgress = false;
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
                        fn,
                        job,
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
    timeoutRequest(promise: Promise<any>, ms: number, retry?:Function) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                this.subManager.emitErrorBarProperties(false, false, false, 6, "Server Error!", "TimeOut! Couldn't connect to the server.", retry);
                this.subManager.emitErrorBarVisible(true);
                reject(new Error("timeOut"))
            }, ms);
            promise.then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.subManager.emitErrorBarProperties(false, false, false, 6, "Server Error!", "TimeOut! Couldn't connect to the server.", retry);
                    this.subManager.emitErrorBarVisible(true);
                    clearTimeout(timeoutId);
                    reject(err);
            });
        });
    }

    /** ----------HANDLING-RESPONSES---------- */

    /** Handles a closeScreen response sent by the server */
    abstract closeScreen(closeScreenData: CloseScreenResponse, request?: any, opensAnother?:boolean):void

    /** A Map which checks which function needs to be called when a data response is received (before regular response map) */
    abstract dataResponseMap: Map<string, Function>;

    /** A Map which checks which function needs to be called when a response is received */
    abstract responseMap: Map<string, Function>;

    /** Calls the correct function based on the responses */
    async responseHandler(responses: Array<BaseResponse>, request:any) {
        // If there is a DataProviderChanged response move it to the start of the responses array
        // to prevent flickering of components.
        if (Array.isArray(responses) && responses.length) {
            responses.sort((a, b) => {
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

            if (responses.length && responses[0].name === RESPONSE_NAMES.CLOSE_SCREEN) {
                const opensNewScreen = responses.some(response => {
                    if (response.name === RESPONSE_NAMES.SCREEN_GENERIC) {
                        if (!(response as GenericResponse).update) {
                            return true;
                        }
                    }
                    return false;
                });
                if (opensNewScreen) {
                    this.closeScreen(responses[0] as CloseScreenResponse, request, true);
                }
                else {
                    this.closeScreen(responses[0] as CloseScreenResponse, request, false);
                }
            }

            for (const [, response] of responses.entries()) {
                const mapper = this.dataResponseMap.get(response.name);
                if (mapper) {
                    await mapper(response, request);
                }
            }

            for (const [, response] of responses.entries()) {
                const mapper = this.responseMap.get(response.name);
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
        if (metaData.aliveInterval !== undefined) {
            this.aliveInterval = metaData.aliveInterval;
        }

        this.appSettings.setMenuOptions(undefined, undefined, undefined, undefined, metaData.userRestart);

        this.appSettings.setApplicationMetaData(metaData);

        if (metaData.langCode) {
            this.appSettings.locale = metaData.langCode;
            setDateLocale(metaData.langCode);
        }
    }

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
                const dataBook = this.contentStore.dataBooks.get(screenName)?.get(dataProvider);
                if (dataBook && dataBook.data && dataBook.data.get("current")) {
                    const length = dataBook.data.get("current").length;
                    const fetchReq = createFetchRequest();
                    fetchReq.fromRow = length;
                    fetchReq.rowCount = (selectedRowIndex - length) + 1;
                    fetchReq.dataProvider = dataProvider;
                    this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH).then((res) => {
                        const newSelectedRow = this.contentStore.getDataRow(screenName, dataProvider, selectedRowIndex);
                        this.contentStore.setSelectedRow(screenName, dataProvider, newSelectedRow, selectedRowIndex, treePath, selectedColumn);
                    });
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
                const styleKeys = ['background', 'foreground', 'font', 'image'];
                const format = entry.format.map(f => f ? f.split(';', 4).reduce((agg, v, i) => v ? {...agg, [styleKeys[i]]: v} : agg, {}) : f);
                entry.records.forEach((r, index) => {
                    if(r.length === 1 && r[0] === -1) {
                        return;
                    }
                    formattedRecords[index] = formattedRecords[index] || {};
                    formattedRecords[index][componentId] = r.reduce<any[]>((agg, c, index) => {
                        agg[index] = format[Math.max(0, Math.min(c, format.length - 1))];

                        if (index === r.length - 1 && fetchData.columnNames.length > r.length) {
                            for (let i =  index; i < fetchData.columnNames.length; i++) {
                                agg[i] = format[Math.max(0, Math.min(c, format.length - 1))];
                            }
                        }
                        return agg;
                    }, [])
                });
            }
        }
        
        return fetchData.records.map((record, index) => {
            const data : any = {
                __recordFormats: formattedRecords[index],
            }
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            data.recordStatus = record[Object.keys(record).length-1]
            return data;
        });
    }

    buildDataToDisplayMap(screenName:string, column: any, dataArray:any[], dataBook:IDataBook, dataProvider:string) {
        let dataToDisplayMap = new Map<string, string>();
        const cellEditor = column.cellEditor as ICellEditorLinked
        if (cellEditor.linkReference.dataToDisplayMap) {
            dataToDisplayMap = cellEditor.linkReference.dataToDisplayMap
        }
        let notifyDataMap = false;
        dataArray.forEach((data) => {
            if (data) {
                if (!cellEditor.linkReference.columnNames.length) {
                    cellEditor.linkReference.columnNames.push(column.columnName)
                }
                const index = cellEditor.linkReference.columnNames.findIndex(colName => colName === column.columnName);
                const referencedData = getExtractedObject(data, [cellEditor.linkReference.referencedColumnNames[index]]);
                const columnViewNames = cellEditor.columnView ? cellEditor.columnView.columnNames : dataBook.metaData!.columnView_table_;
                const columnViewData = getExtractedObject(data, columnViewNames);
                if (cellEditor.displayReferencedColumnName) {
                    const extractDisplayRef = getExtractedObject(data, [...cellEditor.linkReference.referencedColumnNames, cellEditor.displayReferencedColumnName]);
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
                        for (let i = 0; i < count; i++) {
                            displayString = displayString.replace('[asterisk_xyz]', columnViewData[columnViewNames[i]] !== undefined ? columnViewData[columnViewNames[i]] : "");
                        }
                    }
                    else {
                        columnViewNames.forEach((column, i) => {
                            displayString += columnViewData[column] + (i !== columnViewNames.length - 1 ? cellEditor.displayConcatMask : "");
                        });
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
        cellEditor.linkReference.dataToDisplayMap = dataToDisplayMap;
        if (notifyDataMap) {
            this.subManager.notifyLinkedDisplayMapChanged(screenName, dataProvider);
        }
    }

    /**
     * Builds the data and then tells contentStore to update its dataProviderData
     * Also checks if all data of the dataprovider is fetched and sets contentStores dataProviderFetched
     * @param fetchData - the fetchResponse
     * @param detailMapKey - the referenced key which should be added to the map
     */
     processFetch(fetchData: FetchResponse, request: any) {
        const builtData = this.buildDatasets(fetchData);
        const screenName = this.getScreenName(fetchData.dataProvider);

        if (this.contentStore.getDataBook(screenName, fetchData.dataProvider)) {
            const dataBook = this.contentStore.getDataBook(screenName, fetchData.dataProvider) as IDataBook
            dataBook.allFetched = fetchData.isAllFetched;

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
                changedProvider.readOnly,
                changedProvider.changedColumns
            );
        }

        // If there is a deletedRow, delete it and notify the screens
        if (changedProvider.deletedRow !== undefined) {
            const compPanel = this.contentStore.getComponentByName(screenName) as IPanel;
            this.contentStore.deleteDataProviderData(screenName, changedProvider.dataProvider, changedProvider.deletedRow);
            this.subManager.notifyDataChange(screenName, changedProvider.dataProvider);
            this.subManager.notifyScreenDataChange(screenName);
            if (compPanel && this.contentStore.isPopup(compPanel) && this.contentStore.getScreenDataproviderMap(changedProvider.dataProvider.split('/')[1])) {
                this.subManager.notifyDataChange(changedProvider.dataProvider.split('/')[1], changedProvider.dataProvider);
                this.subManager.notifyScreenDataChange(changedProvider.dataProvider.split('/')[1]);
            }
        }

        // Combine changedColumnNames and changedValues and update the dataprovider-data
        if (changedProvider.changedColumnNames !== undefined && changedProvider.changedValues !== undefined && changedProvider.selectedRow !== undefined) {
            const dataRow = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.dataRow;
            let changedData:any = _.object(changedProvider.changedColumnNames, changedProvider.changedValues);
            if (dataRow) {
                changedData = { ...dataRow, ...changedData }
            }
            this.contentStore.updateDataProviderData(screenName, changedProvider.dataProvider, [changedData], changedProvider.selectedRow, changedProvider.selectedRow);
            const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
        // Fetch based on reload
        //else {
            if(changedProvider.reload === -1) {
                if (!this.contentStore.dataBooks.get(this.getScreenName(changedProvider.dataProvider))?.has(changedProvider.dataProvider) && !this.missingDataFetches.includes(changedProvider.dataProvider)) {
                    this.missingDataFetches.push(changedProvider.dataProvider);
                }
                this.contentStore.clearDataFromProvider(screenName, changedProvider.dataProvider, true);
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = changedProvider.dataProvider;
                this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, [() => this.subManager.notifyTreeChanged(changedProvider.dataProvider)], true)
                .then(() => {
                    this.requestQueue = this.requestQueue.filter(req => !((req.request as DataProviderRequest).dataProvider === changedProvider.dataProvider) || !(req.endpoint === REQUEST_KEYWORDS.SELECT_ROW));
                    this.hideTopbar();
                });
            } 
            else if(changedProvider.reload !== undefined) {
                if (!this.contentStore.dataBooks.get(this.getScreenName(changedProvider.dataProvider))?.has(changedProvider.dataProvider) && !this.missingDataFetches.includes(changedProvider.dataProvider)) {
                    this.missingDataFetches.push(changedProvider.dataProvider);
                }
                const fetchReq = createFetchRequest();
                fetchReq.rowCount = 1;
                fetchReq.fromRow = changedProvider.reload;
                fetchReq.dataProvider = changedProvider.dataProvider;
                this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH);
            }
            else {
                const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn;
                this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
            }
        //}
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
            this.subManager.emitErrorBarProperties(true, false, false, 11, translation.get("Session expired!"));
            this.subManager.emitErrorBarVisible(true);
            this.subManager.emitSessionExpiredChanged(true)
        }
        if (this.history?.location.pathname.includes("/home/")) {
            localStorage.setItem("restartScreen", this.history.location.pathname.replaceAll("/", "").substring(indexOfEnd(this.history.location.pathname, "home") - 1));
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

    badClient(badClientData:BadClientResponse) {
        const versionSubstring = badClientData.info.substring(badClientData.info.indexOf("[") + 1, badClientData.info.indexOf("]"));
        const versionSplit = versionSubstring.split("!");
        const clientVersion = versionSplit[0].trim();
        const serverVersion = versionSplit[1].trim();
        this.subManager.emitErrorBarProperties(false, false, true, 12, translation.get("Compatibility issue"), translation.get("The client and server version are incompatible.") + "\n Client: " + clientVersion + " <-> Server: " + serverVersion);
        this.subManager.emitErrorBarVisible(true);
    }
}