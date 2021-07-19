/** 3rd Party imports */
import * as queryString from "querystring";
import {parseString} from "xml2js"

/** Other imports */
import ContentStore from "./ContentStore"
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
         ApplicationSettingsResponse} from "./response";
import { createCloseScreenRequest, createFetchRequest, createOpenScreenRequest, createSetScreenParameterRequest, createStartupRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { IPanel } from "./components/panels"
import { SubscriptionManager } from "./SubscriptionManager";
import { History } from "history";
import TreePath from "./model/TreePath";
import { ToastMessageType } from "primereact/toast";
import AppSettings from "./AppSettings";

/** Type for query */
type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
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
    }

    /** Application name */
    APP_NAME = "";

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

    /** ----------APP-FUNCTIONS---------- */

    /**
     * Function to show a toast
     * @param message - message to show
     */
    showToast = (message: ToastMessageType, err: boolean) => {};
    /**
     * Function to show te timeout dialog
     */
    showDialog = (head:string, body:string) => {};

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
     */
    sendRequest(request: any, endpoint: string, fn?:Function[], job?:boolean, waitForOpenRequests?:boolean){
        let promise = new Promise<any>((resolve) => {
            this.timeoutRequest(fetch(this.BASE_URL+endpoint, this.buildReqOpts(request)), 10000)
            .then((response: any) => response.json())
            .then(this.responseHandler.bind(this))
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
            }).then(results => {
                resolve(results);
            }).catch(error => {
                console.error(error)
            }).finally(() => {
                this.openRequests.delete(request);
            });
        })

        if (waitForOpenRequests && this.openRequests.size) {
            const singlePromise = promise;
            promise = Promise.all(this.openRequests.values()).then(() => singlePromise);
            this.openRequests.set(request, promise);
        } else {
            this.openRequests.set(request, promise);
        }
        return promise;
    }

    /**
     * Returns a promise which times out and throws an error and displays dialog after given ms
     * @param promise - the promise
     * @param ms - the ms to wait before a timeout
     */
    timeoutRequest(promise: Promise<any>, ms: number) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                this.showDialog("Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds.");
                reject(new Error("timeOut"))
            }, ms);
            promise
            .then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.showDialog("Server Error!", err);
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
        .set(RESPONSE_NAMES.APPLICATION_SETTINGS, this.applicationSettings.bind(this));

    /**
     * Calls the correct functions based on the responses received and then calls the routing decider
     * @param responses - the responses received
     */
    async responseHandler(responses: Array<BaseResponse>){
        for (const [, response] of responses.entries()) {
            const mapper = this.responseMap.get(response.name);
            if (mapper) {
                await mapper(response);
            }   
        }
        this.routingDecider(responses);
        return responses;
    }

    /**
     * Sets the clientId in the sessionStorage
     * @param metaData - the applicationMetaDataResponse
     */
    applicationMetaData(metaData: ApplicationMetaDataResponse) {
        sessionStorage.setItem("clientId", metaData.clientId);
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
        if (!genericData.update) {
            const workScreen = genericData.changedComponents[0] as IPanel
            this.contentStore.setActiveScreen(workScreen.name, workScreen.screen_modal_);
            if (this.contentStore.openScreenParameters.has(workScreen.name)) {
                const parameterReq = createSetScreenParameterRequest();
                parameterReq.componentId = workScreen.name;
                parameterReq.parameter = this.contentStore.openScreenParameters.get(workScreen.name);
                //TODO: topbar
                this.sendRequest(parameterReq, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER);
                this.contentStore.openScreenParameters.delete(workScreen.name);
            }
        }
        this.contentStore.updateContent(genericData.changedComponents);
    }

    /**
     * Close Screen handling
     * @param closeScreenData - the close screen response 
     */
    closeScreen(closeScreenData: CloseScreenResponse) {
        this.contentStore.closeScreen(closeScreenData.componentId);
    //     if (this.contentStore.closeScreenParameters.has(closeScreenData.componentId)) {
    //         const parameterReq = createSetScreenParameterRequest();
    //         parameterReq.componentId = closeScreenData.name;
    //         parameterReq.parameter = this.contentStore.closeScreenParameters.get(closeScreenData.componentId);
    //         //TODO: topbar
    //         this.sendRequest(parameterReq, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER);
    //         this.contentStore.openScreenParameters.delete(closeScreenData.name);
    //     }
    }

    /**
     * Sets the menuAction for each menuData and passes it to the contentstore and then triggers its update
     * @param menuData - the menuResponse
     */
    menu(menuData: MenuResponse){
        menuData.entries.forEach(menuItem => {
            menuItem.action = () => {
                const openScreenReq = createOpenScreenRequest();
                openScreenReq.componentId = menuItem.componentId;
                return this.sendRequest(openScreenReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
            }
            this.contentStore.addMenuItem(menuItem, true);
        });
        this.subManager.emitMenuUpdate();
    }

    //Dal
    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
    processRowSelection(selectedRowIndex: number|undefined, dataProvider: string, treePath?:TreePath, selectedColumn?:string){
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1];
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
                this.contentStore.clearSelectedRow(compId, dataProvider);
            }
        }
        else if (selectedRowIndex === undefined && selectedColumn !== undefined) {
            const selectedRow = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider).dataRow;
            const idx = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider).index;
            this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, idx, treePath, selectedColumn);
        }
    }

    /**
     * Returns the data as array with objects of the columnnames and data merged together
     * @param fetchData - the fetchResponse received
     * @returns the data as array with objects of the columnnames and data merged together
     */
    buildDatasets(fetchData: FetchResponse) {
        return fetchData.records.map(record => {
            const data : any = {}
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
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
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1];
        const tempMap: Map<string, boolean> = new Map<string, boolean>();
        tempMap.set(fetchData.dataProvider, fetchData.isAllFetched);
        this.contentStore.dataProviderFetched.set(compId, tempMap);
        // If there is a detailMapKey, call updateDataProviderData with it
        if (detailMapKey !== undefined) {
            this.contentStore.updateDataProviderData(compId, fetchData.dataProvider, builtData, fetchData.to, fetchData.from, fetchData.treePath, detailMapKey);
        }   
        else {
            this.contentStore.updateDataProviderData(compId, fetchData.dataProvider, builtData, fetchData.to, fetchData.from, fetchData.treePath);
        }   
        
        this.contentStore.setSortDefinition(compId, fetchData.dataProvider, fetchData.sortDefinition ? fetchData.sortDefinition : []);

        const selectedColumn = this.contentStore.dataProviderSelectedRow.get(compId)?.get(fetchData.dataProvider)?.selectedColumn;
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider, fetchData.treePath ? new TreePath(fetchData.treePath) : undefined, fetchData.selectedColumn ? fetchData.selectedColumn : selectedColumn);
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
    async processDataProviderChanged(changedProvider: DataProviderChangedResponse) {
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1];
        if(changedProvider.reload === -1) {
            this.contentStore.clearDataFromProvider(compId, changedProvider.dataProvider);
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = changedProvider.dataProvider;
            await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH, [() => this.subManager.notifyTreeChanged(changedProvider.dataProvider)], true)
        } 
        else if(changedProvider.reload !== undefined) {
            const fetchReq = createFetchRequest();
            fetchReq.rowCount = 1;
            fetchReq.fromRow = changedProvider.reload;
            fetchReq.dataProvider = changedProvider.dataProvider;
            await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        }
        else {
            const selectedColumn = this.contentStore.dataProviderSelectedRow.get(compId)?.get(changedProvider.dataProvider)?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
    }

    /**
     * Checks if some metaData already exists for this compId and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
    processMetaData(metaData: MetaDataResponse) {
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1];
        const existingMap = this.contentStore.dataProviderMetaData.get(compId);
        if (existingMap) {
            existingMap.set(metaData.dataProvider, metaData);
            this.subManager.notifyDataProviderChange(compId);
        }

        else {
            const tempMap:Map<string, MetaDataResponse> = new Map<string, MetaDataResponse>();
            tempMap.set(metaData.dataProvider, metaData)
            this.contentStore.dataProviderMetaData.set(compId, tempMap);
            this.subManager.notifyDataProviderChange(compId);
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
        const queryParams: queryType = queryString.parse(window.location.search);
        const startUpRequest = createStartupRequest();
        const authKey = localStorage.getItem("authKey");
        if(queryParams.appName && queryParams.baseUrl){
            startUpRequest.applicationName = queryParams.appName;
            // this.APP_NAME = queryParams.appName;
            // this.BASE_URL = queryParams.baseUrl;
            // this.RESOURCE_URL = queryParams.baseUrl + "/resource/" + queryParams.appName
        }
        if(queryParams.userName && queryParams.password){
            startUpRequest.password = queryParams.password;
            startUpRequest.userName = queryParams.userName;
        }
        if(authKey){
            startUpRequest.authKey = authKey;
        }
        startUpRequest.screenHeight = window.innerHeight;
        startUpRequest.screenWidth = window.innerWidth;
        startUpRequest.deviceMode = "desktop";
        this.contentStore.reset();
        sessionStorage.clear();
        this.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
        this.routingDecider([expData]);
        this.showToast({severity: 'error', summary: expData.title}, true)
        this.subManager.emitRegisterCustom()
        console.error(expData.title)
    }

    /**
     * Shows a toast with the error message
     * @param errData - the errorResponse
     */
    showError(errData: ErrorResponse) {
        if (!errData.silentAbort) {
            this.showToast({severity: 'error', summary: errData.message}, true);
        }
        console.error(errData.details)
    }

    showInfo(infoData: MessageResponse) {
        this.showToast({severity: 'info', summary: infoData.message, sticky: true, closable: false }, false);
    }
 
    /**
     * Shows a toast that the site needs to be reloaded
     * @param reData - the restartResponse
     */
    showRestart(reData:RestartResponse) {
        this.showToast({severity: 'info', summary: 'Reload Page: ' + reData.info}, true);
        console.warn(reData.info);
    }

    /**
     * Fetches the languageResource and fills the translation map
     * @param langData 
     */
    language(langData:LanguageResponse) {
        this.timeoutRequest(fetch(this.RESOURCE_URL + langData.languageResource), 2000)
        .then((response:any) => response.text())
        .then(value => parseString(value, (err, result) => { 
            result.properties.entry.forEach((entry:any) => this.contentStore.translation.set(entry.$.key, entry._));
            this.subManager.emitTranslation();
        }))
    }

    applicationSettings(appSettings:ApplicationSettingsResponse) {
        this.appSettings.setVisibleButtons(appSettings.reload, appSettings.rollback, appSettings.save);
        this.appSettings.setChangePasswordEnabled(appSettings.changePassword);
        this.appSettings.setMenuVisibility(appSettings.menuBar, appSettings.toolBar);
        this.subManager.emitAppSettings(appSettings);
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
                    this.subManager.emitAppReady();
                }
            }
            else if (response.name === RESPONSE_NAMES.SCREEN_GENERIC) {
                const GResponse = (response as GenericResponse);
                const firstComp = (GResponse.changedComponents[0] as IPanel)
                if (!GResponse.update && !firstComp.screen_modal_) {
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
                
                let wasPopup: boolean = false;
                for (let entry of this.contentStore.flatContent.entries()) {
                    if (entry[1].name === CSResponse.componentId) {
                        //this.contentStore.closeScreen(entry[1].name);
                        if ((entry[1] as IPanel).screen_modal_) {
                            wasPopup = true;
                        }
                        break; //quit loop because there might be a new screen of the same type
                    }
                }
                if (highestPriority < 1 && !wasPopup) {
                    highestPriority = 1;
                    routeTo = "home";
                }
            }
            else if (response.name === RESPONSE_NAMES.LOGIN || response.name === RESPONSE_NAMES.SESSION_EXPIRED) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    routeTo = "login";
                    this.subManager.emitAppReady();
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