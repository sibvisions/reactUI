/** 3rd Party imports */
import {parseString} from "xml2js"
import * as _ from 'underscore'

/** Other imports */
import ContentStore, { IDataBook } from "./ContentStore"
import { ApplicationMetaDataResponse,
         BaseResponse,
         MenuResponse,
         GenericResponse,
         CloseScreenResponse,
         RESPONSE_NAMES,
         AuthenticationDataResponse,
         UserDataResponse,
         FetchResponse,
         MetaDataResponse,
         DataProviderChangedResponse,
         ShowDocumentResponse,
         UploadResponse,
         DownloadResponse,
         SessionExpiredResponse,
         ErrorResponse,
         RestartResponse,
         ApplicationParametersResponse,
         LanguageResponse, 
         MessageResponse,
         LoginResponse,
         ApplicationSettingsResponse,
         DeviceStatusResponse,
         WelcomeDataResponse,
         DialogResponse,
         CloseFrameResponse,
         ContentResponse,
         CloseContentResponse} from "./response";
import { createFetchRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { IPanel } from "./components/panels"
import { SubscriptionManager } from "./SubscriptionManager";
import { History } from "history";
import TreePath from "./model/TreePath";
import AppSettings from "./AppSettings";
import API from "./API";
import COMPONENT_CLASSNAMES from "./components/COMPONENT_CLASSNAMES";

export enum RequestQueueMode {
    QUEUE = "queue",
    IMMEDIATE = "immediate"
}

/** Server class sends requests and handles responses */
class Server {

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     * @param subManager - subscription-manager instance
     * @param history - the history
     * @param openRequests - the current open requests
     */
    constructor(store: ContentStore, subManager:SubscriptionManager, appSettings:AppSettings, history?: History<any>) {
        this.contentStore = store;
        this.subManager = subManager;
        this.appSettings = appSettings;
        this.history = history;
        this.openRequests = new Map<any, Promise<any>>();
        this.api = new API(this, store, appSettings, subManager, history);
    }

    /** Base url for requests */
    BASE_URL = "";

    /** Resource url for receiving images etc. */
    RESOURCE_URL = "";

    /** Contentstore instance */
    contentStore: ContentStore;
    /** SubscriptionManager instance */
    subManager:SubscriptionManager;
    /** AppSettings instance */
    appSettings:AppSettings;
    /** the react routers history object */
    history?:History<any>;
    /** a map of still open requests */
    openRequests: Map<any, Promise<any>>;
    /** the request queue */
    requestQueue: Function[] = [];
    /** flag if a request is in progress */
    requestInProgress = false;
    /** embedded options, null if not defined */
    embedOptions:{ [key:string]:any }|null = null;

    api:API;

    onMenuFunction:Function = () => {};

    onOpenScreenFunction:Function = () => {};

    onLoginFunction:Function = () => {};

    lastClosedWasPopUp = false;

    

    setAPI(api:API) {
        this.api = api;
    }

    setOnMenuFunction(fn:Function) {
        this.onMenuFunction = fn;
    }

    setOnOpenScreenFunction(fn:Function) {
        this.onOpenScreenFunction = fn;
    }

    setOnLoginFunction(fn:Function) {
        this.onLoginFunction = fn;
    }

    componentExists(name:string) {
        for (let [, value] of this.contentStore.flatContent.entries()) {
            if (value.name === name) {
                return true;
            }
        }

        for (let [, value] of this.contentStore.replacedContent.entries()) {
            if (value.name === name) {
                return true;
            }
        }

        if (this.contentStore.dialogButtons.includes(name)) {
            return true;
        }

        return false;
    }

    /** ----------APP-FUNCTIONS---------- */

    /**
     * Builds a request to send to the server
     * @param request - the request to send
     * @returns - a request to send to the server
     */
    buildReqOpts(request:any) {
        let reqOpt: RequestInit = {
            method: 'POST',
            body: JSON.stringify(request),
            credentials:"include",
        };
        return reqOpt;
    }

    /** ----------SENDING-REQUESTS---------- */

    /**
     * Sends a request to the server and handles its response, if there are jobs in the
     * SubscriptionManagers JobQueue, call them after the response handling is complete
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
    ) {
        let promise = new Promise<any>((resolve, reject) => {
            if (
                request.componentId 
                && endpoint !== REQUEST_ENDPOINTS.OPEN_SCREEN 
                && endpoint !== REQUEST_ENDPOINTS.CLOSE_FRAME 
                && !this.componentExists(request.componentId)
            ) {
                reject("Component doesn't exist");
            } else {
                if (queueMode == RequestQueueMode.IMMEDIATE) {
                    this.timeoutRequest(
                        fetch(this.BASE_URL + endpoint, this.buildReqOpts(request)), 
                        10000, 
                        () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, queueMode)
                    )
                        .then((response: any) => response.json())
                        .then(result => {
                            if (this.appSettings.applicationMetaData.aliveInterval) {
                                this.contentStore.restartAliveSending(this.appSettings.applicationMetaData.aliveInterval);
                            }
                            
                            if (result.code) {
                                if (400 >= result.code && result.code <= 599) {
                                    return Promise.reject(result.code + " " + result.reasonPhrase + ". " + result.description);
                                }
                            }
                            return result;
                        })
                        .then(this.responseHandler.bind(this), (err) => Promise.reject(err))
                        .then(results => {
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
                                this.subManager.emitDialog("server", false, splitErr[0], splitErr[1], () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests));
                            }
                            else {
                                this.subManager.emitDialog("server", false, "Error occured!", "Check the console for more info.", () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests));
                            }
                            this.subManager.emitErrorDialogVisible(true);
                            console.error(error)
                        }).finally(() => {
                            this.openRequests.delete(request);
                        });
                } else {
                    this.requestQueue.push(() => this.sendRequest(
                        request, 
                        endpoint,
                        fn,
                        job,
                        waitForOpenRequests,
                        RequestQueueMode.IMMEDIATE
                    ).then(results => {
                        resolve(results)
                    }))
                    this.advanceRequestQueue();
                }
            }
        })

        if (queueMode == RequestQueueMode.IMMEDIATE) {
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

    advanceRequestQueue() {
        if(!this.requestInProgress) {
            const request = this.requestQueue.shift();
            if (request) {
                this.requestInProgress = true;
                request().finally(() => {
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
                this.subManager.emitDialog("server", false, "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds. <u>Click here to retry!</u> or press Escape to retry!", retry);
                this.subManager.emitErrorDialogVisible(true);
                reject(new Error("timeOut"))
            }, ms);
            promise.then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.subManager.emitDialog("server", false, "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds. <u>Click here</u> or press Escape to retry!", retry);
                    this.subManager.emitErrorDialogVisible(true);
                    clearTimeout(timeoutId);
                    reject(err);
            });
        });
    }

    /** ----------HANDLING-RESPONSES---------- */

    /** A Map which checks which function needs to be called when a response is received */
    responseMap = new Map<string, Function>()
        .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
        .set(RESPONSE_NAMES.USER_DATA, this.userData.bind(this))
        .set(RESPONSE_NAMES.MENU, this.menu.bind(this))
        .set(RESPONSE_NAMES.SCREEN_GENERIC, this.generic.bind(this))
        .set(RESPONSE_NAMES.CLOSE_SCREEN, this.closeScreen.bind(this))
        .set(RESPONSE_NAMES.AUTHENTICATION_DATA, this.authenticationData.bind(this))
        .set(RESPONSE_NAMES.DAL_FETCH, this.processFetch.bind(this))
        .set(RESPONSE_NAMES.DAL_META_DATA, this.processMetaData.bind(this))
        .set(RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED, this.processDataProviderChanged.bind(this))
        .set(RESPONSE_NAMES.LOGIN, this.login.bind(this))
        .set(RESPONSE_NAMES.UPLOAD, this.upload.bind(this))
        .set(RESPONSE_NAMES.DOWNLOAD, this.download.bind(this))
        .set(RESPONSE_NAMES.SHOW_DOCUMENT, this.showDocument.bind(this))
        .set(RESPONSE_NAMES.SESSION_EXPIRED, this.sessionExpired.bind(this))
        .set(RESPONSE_NAMES.ERROR, this.showError.bind(this))
        .set(RESPONSE_NAMES.RESTART, this.showRestart.bind(this))
        .set(RESPONSE_NAMES.APPLICATION_PARAMETERS, this.applicationParameters.bind(this))
        .set(RESPONSE_NAMES.LANGUAGE, this.language.bind(this))
        .set(RESPONSE_NAMES.INFORMATION, this.showInfo.bind(this))
        .set(RESPONSE_NAMES.APPLICATION_SETTINGS, this.applicationSettings.bind(this))
        .set(RESPONSE_NAMES.DEVICE_STATUS, this.deviceStatus.bind(this))
        .set(RESPONSE_NAMES.WELCOME_DATA, this.welcomeData.bind(this))
        .set(RESPONSE_NAMES.DIALOG, this.showMessageDialog.bind(this))
        .set(RESPONSE_NAMES.CLOSE_FRAME, this.closeFrame.bind(this))
        .set(RESPONSE_NAMES.CONTENT, this.content.bind(this))
        .set(RESPONSE_NAMES.CLOSE_CONTENT, this.closeContent.bind(this));

    /**
     * Calls the correct functions based on the responses received and then calls the routing decider
     * @param responses - the responses received
     */
    async responseHandler(responses: Array<BaseResponse>) {
        let isOpen = false;
        // If there is a DataProviderChanged response move it to the start of the responses array
        // to prevent flickering of components.
        if (Array.isArray(responses)) {
            responses.forEach((response, idx) => {
                if (response.name === RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED) {
                    responses.splice(0, 0, responses.splice(idx, 1)[0]);
                }
                else if (response.name === RESPONSE_NAMES.SCREEN_GENERIC && !(response as GenericResponse).update) {
                    isOpen = true;
                }
            });

            for (const [, response] of responses.entries()) {
                const mapper = this.responseMap.get(response.name);
                if (mapper) {
                    if (response.name === RESPONSE_NAMES.CLOSE_SCREEN && isOpen) {
                        await mapper(response, isOpen);
                    }
                    else {
                        await mapper(response);
                    }
                    
                }
            }
            this.routingDecider(responses);
        }

        return responses;
    }

    /**
     * Sets the clientId in the sessionStorage
     * @param metaData - the applicationMetaDataResponse
     */
    applicationMetaData(metaData: ApplicationMetaDataResponse) {
        sessionStorage.setItem("clientId", metaData.clientId);
        this.RESOURCE_URL = this.BASE_URL + "/resource/" + metaData.applicationName;
        this.appSettings.setApplicationMetaData(metaData);
    }

    /**
     * Calls contentStores handleCustomProperties for every applicationParameter 
     * @param appParams - the applicationParametersResponse
     */
    applicationParameters(appParams:ApplicationParametersResponse) {
        for (const [key, value] of Object.entries(appParams)) {
            if (key !== "name")
                this.contentStore.handleCustomProperties(key, value);
        }
    }

    /**
     * Sets the currentUser in contentStore
     * @param userData - the userDataResponse
     */
    userData(userData: UserDataResponse) {
        this.contentStore.currentUser = userData;
        this.onLoginFunction();
    }

    /**
     * Sets the authKey in localStorage
     * @param authData - the authenticationDataResponse
     */
    authenticationData(authData: AuthenticationDataResponse) {
        localStorage.setItem("authKey", authData.authKey);
    }

    /**
     * Resets the contentStore
     * @param login - the loginDataResponse
     */
    login(login: LoginResponse){
        this.appSettings.setLoginMode(login.mode);
        this.contentStore.reset();
    }


    /**
     * Calls the contentStore updateContent function 
     * @param genericData - the genericResponse
     */
    generic(genericData: GenericResponse) {
        if (genericData.changedComponents && genericData.changedComponents.length) {
            this.contentStore.updateContent(genericData.changedComponents, false);
        }
        if (!genericData.update) {
            let workScreen:IPanel|undefined
            if(genericData.changedComponents && genericData.changedComponents.length) {
                workScreen = genericData.changedComponents[0] as IPanel;
                this.contentStore.setActiveScreen({ name: genericData.componentId, className: workScreen ? workScreen.screen_className_ : "" }, workScreen ? workScreen.screen_modal_ : false);
                if (workScreen.screen_modal_ && this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2] && this.contentStore.getScreenDataproviderMap(this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2].name)) {
                    this.contentStore.dataBooks.set(workScreen.name, this.contentStore.getScreenDataproviderMap(this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2].name) as Map<string, IDataBook>);
                }
            }
            this.onOpenScreenFunction();
        }
    }

    /**
     * Close Screen handling
     * @param closeScreenData - the close screen response 
     */
    closeScreen(closeScreenData: CloseScreenResponse, opensAnother:boolean) {
        for (let entry of this.contentStore.flatContent.entries()) {
            if (entry[1].name === closeScreenData.componentId) {
                if ((entry[1] as IPanel).screen_modal_) {
                    this.lastClosedWasPopUp = true;
                }
                else {
                    this.lastClosedWasPopUp = false;
                }
                break;
            }
        }
        this.contentStore.closeScreen(closeScreenData.componentId, opensAnother);
    }

    /**
     * Sets the menuAction for each menuData and passes it to the contentstore and then triggers its update
     * @param menuData - the menuResponse
     */
    menu(menuData: MenuResponse) {
        if (menuData.entries && menuData.entries.length) {
            menuData.entries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                this.contentStore.addMenuItem(entry);
            })
        }
        if (menuData.toolBarEntries && menuData.toolBarEntries.length) {
            menuData.toolBarEntries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                this.contentStore.addToolbarItem(entry);
            })
        }
        this.onMenuFunction();
        this.subManager.emitMenuUpdate();
        this.subManager.emitToolBarUpdate();
    }

    //Dal

    getCompId(dataProvider:string) {
        if (this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1]) {
            return this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;
        }
        else {
            return dataProvider.split("/")[1];
        }
    }

    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
    processRowSelection(selectedRowIndex: number|undefined, dataProvider: string, treePath?:TreePath, selectedColumn?:string) {
        const compId = this.getCompId(dataProvider);
        if(selectedRowIndex !== -1 && selectedRowIndex !== -0x80000000 && selectedRowIndex !== undefined) {
            /** The data of the row */
            const selectedRow = this.contentStore.getDataRow(compId, dataProvider, selectedRowIndex);
            this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, selectedRowIndex, treePath, selectedColumn);
        } 
        else if(selectedRowIndex === -1) {
            if (treePath !== undefined && treePath.length() > 0) {
                const selectedRow = this.contentStore.getDataRow(compId, dataProvider, treePath.getLast());
                this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, treePath.getLast(), treePath.getParentPath(), selectedColumn)
            }
            else {
                //this.contentStore.clearSelectedRow(compId, dataProvider);
                this.contentStore.setSelectedRow(compId, dataProvider, {}, -1, undefined, selectedColumn)
            }
        }
        else if (selectedRowIndex === undefined && selectedColumn !== undefined) {
            if(this.contentStore.getDataBook(compId, dataProvider)?.selectedRow) {
                const selectedRow = this.contentStore.getDataBook(compId, dataProvider)!.selectedRow!.dataRow;
                const idx = this.contentStore.getDataBook(compId, dataProvider)!.selectedRow!.index;
                this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, idx, treePath, selectedColumn);
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
                    formattedRecords[index][componentId] = r.reduce<Record<string, any>>((agg, c, index) => {
                        agg[fetchData.columnNames[index]] = format[Math.max(0, Math.min(c, format.length - 1))];
                        return agg;
                    }, {})
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

    /**
     * Builds the data and then tells contentStore to update its dataProviderData
     * Also checks if all data of the dataprovider is fetched and sets contentStores dataProviderFetched
     * @param fetchData - the fetchResponse
     * @param referenceKey - the referenced key which should be added to the map
     */
    processFetch(fetchData: FetchResponse, detailMapKey?: string) {
        const builtData = this.buildDatasets(fetchData);
        const compId = this.getCompId(fetchData.dataProvider);
        const tempMap: Map<string, boolean> = new Map<string, boolean>();
        tempMap.set(fetchData.dataProvider, fetchData.isAllFetched);
                
        // If there is a detailMapKey, call updateDataProviderData with it
        this.contentStore.updateDataProviderData(
            compId, 
            fetchData.dataProvider, 
            builtData, 
            fetchData.to, 
            fetchData.from, 
            fetchData.treePath,
            detailMapKey,
            fetchData.recordFormat,
        );

        if (this.contentStore.getDataBook(compId, fetchData.dataProvider)) {
            this.contentStore.getDataBook(compId, fetchData.dataProvider)!.allFetched = fetchData.isAllFetched
        }
        
        this.contentStore.setSortDefinition(compId, fetchData.dataProvider, fetchData.sortDefinition ? fetchData.sortDefinition : []);

        const selectedColumn = this.contentStore.getDataBook(compId, fetchData.dataProvider)?.selectedRow?.selectedColumn;
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider, fetchData.treePath ? new TreePath(fetchData.treePath) : undefined, fetchData.selectedColumn ? fetchData.selectedColumn : selectedColumn);
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
    async processDataProviderChanged(changedProvider: DataProviderChangedResponse) {
        const compId = this.getCompId(changedProvider.dataProvider);

        if (changedProvider.changedColumnNames !== undefined && changedProvider.changedValues !== undefined && changedProvider.selectedRow !== undefined) {
            const changedData:any = _.object(changedProvider.changedColumnNames, changedProvider.changedValues);
            this.contentStore.updateDataProviderData(compId, changedProvider.dataProvider, [changedData], changedProvider.selectedRow, changedProvider.selectedRow);
            const selectedColumn = this.contentStore.getDataBook(compId, changedProvider.dataProvider)?.selectedRow?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
        else {
            if(changedProvider.reload === -1) {
                this.contentStore.clearDataFromProvider(compId, changedProvider.dataProvider);
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH, [() => this.subManager.notifyTreeChanged(changedProvider.dataProvider)], true, undefined, RequestQueueMode.IMMEDIATE)
            } 
            else if(changedProvider.reload !== undefined) {
                const fetchReq = createFetchRequest();
                fetchReq.rowCount = 1;
                fetchReq.fromRow = changedProvider.reload;
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH, undefined, undefined, undefined, RequestQueueMode.IMMEDIATE);
            }
            else {
                const selectedColumn = this.contentStore.getDataBook(compId, changedProvider.dataProvider)?.selectedRow?.selectedColumn;
                this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
            }
        }
    }

    /**
     * Checks if some metaData already exists for this compId and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
    processMetaData(metaData: MetaDataResponse) {
        const compId = this.getCompId(metaData.dataProvider);
        const compPanel = this.contentStore.getComponentByName(compId) as IPanel;
        const existingMap = this.contentStore.getScreenDataproviderMap(compId);
        if (existingMap) {
            if (existingMap.has(metaData.dataProvider)) {
                (existingMap.get(metaData.dataProvider) as IDataBook).metaData = metaData;
            }
            else {
                existingMap.set(metaData.dataProvider, {metaData: metaData});
            }
        }
        else {
            const tempMap:Map<string, IDataBook> = new Map<string, IDataBook>();
            tempMap.set(metaData.dataProvider, {metaData: metaData})
            this.contentStore.dataBooks.set(compId, tempMap);
        }
        this.subManager.notifyMetaDataChange(compId, metaData.dataProvider);
        if (compPanel && this.contentStore.isPopup(compPanel) && this.contentStore.getScreenDataproviderMap(metaData.dataProvider.split('/')[1])) {
            this.subManager.notifyMetaDataChange(metaData.dataProvider.split('/')[1], metaData.dataProvider);
        }
    }

    //Down- & UpLoad

    /**
     * Opens a fileSelectDialog and sends the selected file to the server
     * @param uploadData - the uploadResponse
     */
    upload(uploadData: UploadResponse){
        const inputElem = document.createElement('input');
        inputElem.type = 'file';
        inputElem.click()
        inputElem.onchange = (e) => {
            const formData = new FormData();
            formData.set("clientId", sessionStorage.getItem("clientId") || "")
            formData.set("fileId", uploadData.fileId)
            // @ts-ignore
            formData.set("data", e.target.files[0])
            let reqOpt: RequestInit = {
                method: 'POST',
                body: formData,
                credentials:"include",
            };

            this.timeoutRequest(fetch(this.BASE_URL + REQUEST_ENDPOINTS.UPLOAD, reqOpt), 10000)
                .then((response: any) => response.json())
                .then(this.responseHandler.bind(this))
                .catch(error => console.error(error));
        }
    }

    /**
     * Downloads the file
     * @param downloadData - the downloadResponse
     */
    download(downloadData: DownloadResponse){
        const a = document.createElement('a');
        a.href = downloadData.url.split(';')[0];
        a.setAttribute('download', downloadData.fileName);
        a.click();
    }

    /**
     * Opens a link
     * @param showData - the showDocumentResponse
     */
    showDocument(showData: ShowDocumentResponse) {
        const a = document.createElement('a');
        a.style.display = 'none';
        let splitURL = showData.url.split(';')
        a.href = splitURL[0];
        a.setAttribute('target', splitURL[2]);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * When the session expires send a new startupRequest to the server like in app and reset the contentStore
     * @param expData - the sessionExpiredResponse
     */
    sessionExpired(expData: SessionExpiredResponse) {
        this.subManager.emitDialog("server", true, this.contentStore.translation.get("Session expired!"), this.contentStore.translation.get("Take note of any unsaved data, and <u>click here</u> or press ESC to continue."));
        this.subManager.emitErrorDialogVisible(true);
        this.contentStore.reset();
        sessionStorage.clear();
        console.error(expData.title);
    }

    /**
     * Shows a toast with the error message
     * @param errData - the errorResponse
     */
    showError(errData: ErrorResponse) {
        if (!errData.silentAbort) {
            this.subManager.emitMessage(errData, "error");
        }
        console.error(errData.details)
    }

    showInfo(infoData: MessageResponse) {
        this.subManager.emitMessage(infoData, "error");
    }

    showMessageDialog(dialogData:DialogResponse) {
        this.contentStore.dialogButtons = [];
        if (dialogData.okComponentId) {
            this.contentStore.dialogButtons.push(dialogData.okComponentId);
        }
        
        if (dialogData.cancelComponentId) {
            this.contentStore.dialogButtons.push(dialogData.cancelComponentId);
        }

        if (dialogData.notOkComponentId) {
            this.contentStore.dialogButtons.push(dialogData.notOkComponentId);
        }

        this.subManager.emitMessageDialog("message-dialog", dialogData);
    }
 
    /**
     * Shows a toast that the site needs to be reloaded
     * @param reData - the restartResponse
     */
    showRestart(reData:RestartResponse) {
        this.subManager.emitMessage({ message: 'Reload Page: ' + reData.info, name: "" }, "error")
        console.warn(reData.info);
    }

    /**
     * Fetches the languageResource and fills the translation map
     * @param langData - the language data
     */
    language(langData:LanguageResponse) {
        this.timeoutRequest(fetch(this.RESOURCE_URL + langData.languageResource), 2000)
        .then((response:any) => response.text())
        .then(value => parseString(value, (err, result) => { 
            if (result) {
                result.properties.entry.forEach((entry:any) => this.contentStore.translation.set(entry.$.key, entry._));
                this.appSettings.setAppReadyParam("translation");
                this.subManager.emitTranslation();
            }
        }));
    }

    /** 
     * Sets the application-settings and notifies the subscribers
     * @param appSettings
     */
    applicationSettings(appSettings:ApplicationSettingsResponse) {
        this.appSettings.setVisibleButtons(appSettings.reload, appSettings.rollback, appSettings.save);
        this.appSettings.setChangePasswordEnabled(appSettings.changePassword);
        this.appSettings.setMenuVisibility(appSettings.menuBar, appSettings.toolBar);
        if (appSettings.desktop && appSettings.desktop.length) {
            if (appSettings.desktop[0].className === COMPONENT_CLASSNAMES.DESKTOPPANEL) {
                this.appSettings.setDesktopPanel(appSettings.desktop[0]);
            }
            this.contentStore.updateContent(appSettings.desktop, true);
        }
        this.subManager.emitAppSettings(appSettings);
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
     * Sets the welcome-screen in app-settings
     * @param welcomeData - the welcome-data response
     */
    welcomeData(welcomeData:WelcomeDataResponse) {
        this.appSettings.setWelcomeScreen(welcomeData.homeScreen);
    }

    closeFrame(closeFrameData:CloseFrameResponse) {
        this.subManager.emitCloseFrame(closeFrameData.componentId);
    }

    content(contentData:ContentResponse) {
        if (contentData.changedComponents && contentData.changedComponents.length) {
            this.contentStore.updateContent(contentData.changedComponents, false);
        }
        if (!contentData.update) {
            let workScreen:IPanel|undefined
            if(contentData.changedComponents && contentData.changedComponents.length) {
                workScreen = contentData.changedComponents[0] as IPanel
                this.contentStore.setActiveScreen({ name: workScreen.name, className: workScreen ? workScreen.content_className_ : "" }, workScreen ? workScreen.content_modal_ : false);
            }
        }
    }

    closeContent(closeContentData:CloseContentResponse) {
        if (closeContentData.componentId) {
            this.contentStore.closeScreen(closeContentData.componentId, undefined, true);
        }
    }

    /** ----------ROUTING---------- */

    /**
     * Decides if and where to the user should be routed based on all responses.
     * When the user is redirected to login, or gets auto logged in, app is set to ready
     * @param responses - the response array
     */
    routingDecider(responses: Array<BaseResponse>) {
        let routeTo: string | undefined;
        let highestPriority = 0;

        responses.forEach(response => {
            if (response.name === RESPONSE_NAMES.USER_DATA) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    routeTo = "home";
                    this.appSettings.setAppReadyParam("userOrLogin");
                }
            }
            else if (response.name === RESPONSE_NAMES.SCREEN_GENERIC) {
                const GResponse = (response as GenericResponse);
                let firstComp;
                if (GResponse.changedComponents && GResponse.changedComponents.length) {
                    firstComp = GResponse.changedComponents[0] as IPanel
                }
                if (!GResponse.update && firstComp && !firstComp.screen_modal_) {
                    if (highestPriority < 2) {
                        highestPriority = 2;
                        routeTo = "home/" + this.contentStore.navigationNames.get(GResponse.componentId);
                    }
                }
            }
            else if (response.name === RESPONSE_NAMES.CLOSE_SCREEN) {
                const CSResponse = (response as CloseScreenResponse);
                
                //let's do a sanitycheck in case of a reload by checking if the screen to close 
                //should actually be opened by the same request
                if(responses.find(r => 
                    r.name === RESPONSE_NAMES.SCREEN_GENERIC 
                    && (r as GenericResponse).componentId === CSResponse.componentId
                )) {
                    //count how many components for that screen there are
                    let c = 0;
                    this.contentStore.flatContent.forEach((value) => {
                        if(value.name === CSResponse.componentId) {
                            c++;
                        }
                    });
                    //if there is only one don't remove it
                    if(c <= 1) {
                        return;
                    }
                }
                
                if (highestPriority < 1 && !this.lastClosedWasPopUp) {
                    highestPriority = 1;
                    routeTo = "home";
                }
            }
            else if (response.name === RESPONSE_NAMES.LOGIN) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    routeTo = "login";
                    this.appSettings.setAppReadyParam("userOrLogin");
                }
            }
            //    else if (response.name === "settings") {
            //        routeTo = "home/settings";
            //    }
        });


        if (routeTo) {
            //window.location.hash = "/"+routeTo
            this.history?.push(`/${routeTo}`);
        }
    }
}
export default Server