/** 3rd Party imports */
import * as queryString from "querystring";
import {parseString} from "xml2js"

/** Other imports */
import ContentStore from "./ContentStore"
import ApplicationMetaData from "./response/ApplicationMetaDataResponse";
import BaseResponse from "./response/BaseResponse";
import MenuResponse from "./response/MenuResponse";
import GenericResponse from "./response/GenericResponse";
import CloseScreenResponse from "./response/CloseScreenResponse";
import RESPONSE_NAMES from "./response/RESPONSE_NAMES";
import AuthenticationDataResponse from "./response/AuthenticationDataResponse";
import UserDataResponse from "./response/UserDataResponse";
import FetchResponse from "./response/FetchResponse";
import MetaDataResponse from "./response/MetaDataResponse";
import DataProviderChangedResponse from "./response/DataProviderChangedResponse";
import ShowDocumentResponse from "./response/ShowDocumentResponse"
import {createFetchRequest, createOpenScreenRequest, createStartupRequest} from "./factories/RequestFactory";
import REQUEST_ENDPOINTS from "./request/REQUEST_ENDPOINTS";
import UploadResponse from "./response/UploadResponse";
import DownloadResponse from "./response/DownloadResponse";
import SessionExpiredResponse from "./response/SessionExpiredResponse";
import ErrorResponse from "./response/ErrorResponse";
import {Panel} from "./components/panels/panel/UIPanel"
import RestartResponse from "./response/RestartResponse";
import ApplicationParametersResponse from "./response/ApplicationParametersResponse";
import LanguageResponse from "./response/LanguageResponse";

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
     */
    constructor(store: ContentStore) {
        this.contentStore = store
    }

    /** Application name */
    APP_NAME = ""
    /** Base url for requests */
    BASE_URL = ""
    /** Resource url for receiving images etc. */
    RESOURCE_URL = ""
    /** Contentstore instance */
    contentStore: ContentStore;
    /**
     * Function to show a toast
     * @param message - message to show
     */
    showToast = (message: any) => {};
 
    /**
     * Sends a request to the server and handles its response
     * @param request - the request to send
     * @param endpoint - the endpoint to send the request to
     */
    sendRequest(request: any, endpoint: string){
        let reqOpt: RequestInit = {
            method: 'POST',
            body: JSON.stringify(request),
            credentials:"include",
        };
        this.timeoutRequest(fetch(this.BASE_URL+endpoint, reqOpt), 2000)
            .then((response: any) => response.json())
            .then(this.responseHandler.bind(this))
            .catch(error => console.error(error));
    }

    /**
     * Returns a promise which times out and throws an error after given ms
     * @param promise - the promise
     * @param ms - the ms to wait before a timeout
     */
    timeoutRequest(promise: Promise<any>, ms: number) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                reject(new Error("timeOut"))
            }, ms);
            promise
            .then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    /** A Map which checks which function needs to be called when a response is received */
    responseMap = new Map<string, Function>()
        .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
        .set(RESPONSE_NAMES.USER_DATA, this.userData.bind(this))
        .set(RESPONSE_NAMES.MENU, this.menu.bind(this))
        .set(RESPONSE_NAMES.SCREEN_GENERIC, this.generic.bind(this))
        //.set(RESPONSE_NAMES.CLOSE_SCREEN, this.closeScreen.bind(this))
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
        .set(RESPONSE_NAMES.LANGUAGE, this.language.bind(this));

    /**
     * Calls the correct functions based on the responses received and then calls the routing decider
     * @param responses - the responses received
     */
    responseHandler(responses: Array<BaseResponse>){
        responses.forEach((responseObject: BaseResponse) => {
            const mapper = this.responseMap.get(responseObject.name);
            if(mapper){
                mapper(responseObject);
            }
        });

        this.routingDecider(responses);
    }

    /**
     * Sets the clientId in the sessionStorage
     * @param metaData - the applicationMetaDataResponse
     */
    applicationMetaData(metaData: ApplicationMetaData){
        sessionStorage.setItem("clientId", metaData.clientId);
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
    userData(userData: UserDataResponse){
        this.contentStore.currentUser = userData;
    }

    /**
     * Sets the authKey in localStorage
     * @param authData - the authenticationDataResponse
     */
    authenticationData(authData: AuthenticationDataResponse){
        localStorage.setItem("authKey", authData.authKey);
    }

    /**
     * Resets the contentStore
     * @param login - the loginDataResponse
     */
    login(login: any){
        this.contentStore.reset();
    }


    /**
     * Calls the contentStore updateContent function 
     * @param genericData - the genericResponse
     */
    generic(genericData: GenericResponse){
        this.contentStore.updateContent(genericData.changedComponents);
    }

    // closeScreen(closeScreenData: CloseScreenResponse){
    //     this.contentStore.closeScreen(closeScreenData.componentId);
    // }

    /**
     * Sets the menuAction for each menuData and passes it to the contentstore and then triggers its update
     * @param menuData - the menuResponse
     */
    menu(menuData: MenuResponse){
        menuData.entries.forEach(menuItem => {
            menuItem.action = () => {
                const openScreenReq = createOpenScreenRequest();
                openScreenReq.componentId = menuItem.componentId;
                this.sendRequest(openScreenReq, REQUEST_ENDPOINTS.OPEN_SCREEN);
            }
            this.contentStore.addMenuItem(menuItem, true);
        });
        this.contentStore.emitMenuUpdate();
    }

    //Dal
    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
    processRowSelection(selectedRowIndex: number|undefined, dataProvider: string){
        const compId = dataProvider.split('/')[1];
        if(selectedRowIndex !== -1 && selectedRowIndex !== undefined) {
            /** The data of the row */
            const selectedRow = this.contentStore.getDataRow(compId, dataProvider, selectedRowIndex);
            this.contentStore.setSelectedRow(compId, dataProvider, selectedRow);
            this.contentStore.emitRowSelect(compId, dataProvider);
        } else if(selectedRowIndex === -1) {
            this.contentStore.clearSelectedRow(compId, dataProvider);
            this.contentStore.emitRowSelect(compId, dataProvider);
        }
    }

    /**
     * Builds the data and then tells contentStore to update its dataProviderData
     * Also checks if all data of the dataprovider is fetched and sets contentStores dataProviderFetched
     * @param fetchData - the fetchResponse
     */
    processFetch(fetchData: FetchResponse) {
        const builtData = fetchData.records.map(record => {
            const data : any = {}
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            return data;
        });
        const compId = fetchData.dataProvider.split('/')[1];
        const tempMap:Map<string, boolean> = new Map<string, boolean>();
        tempMap.set(fetchData.dataProvider, fetchData.isAllFetched);
        this.contentStore.dataProviderFetched.set(compId, tempMap);
        if(fetchData.records.length !== 0)
            this.contentStore.updateDataProviderData(compId, fetchData.dataProvider, builtData, fetchData.to, fetchData.from);
        else
            this.contentStore.notifyDataChange(compId, fetchData.dataProvider);
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider);
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
    processDataProviderChanged(changedProvider: DataProviderChangedResponse){
        const compId = changedProvider.dataProvider.split('/')[1];
        if(changedProvider.reload === -1) {
            this.contentStore.clearDataFromProvider(compId, changedProvider.dataProvider);
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = changedProvider.dataProvider;
            this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        } else if(changedProvider.reload !== undefined) {
            const fetchReq = createFetchRequest();
            fetchReq.rowCount = 1;
            fetchReq.fromRow = changedProvider.reload;
            fetchReq.dataProvider = changedProvider.dataProvider;
            this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        }
        this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider);
    }

    /**
     * Checks if some metaData already exists for this compId and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
    processMetaData(metaData: MetaDataResponse) {
        const compId = metaData.dataProvider.split('/')[1];
        const existingMap = this.contentStore.dataProviderMetaData.get(compId);
        if (existingMap)
            existingMap.set(metaData.dataProvider, metaData);
        else {
            const tempMap:Map<string, MetaDataResponse> = new Map<string, MetaDataResponse>();
            tempMap.set(metaData.dataProvider, metaData)
            this.contentStore.dataProviderMetaData.set(compId, tempMap);
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
        this.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
        this.routingDecider([expData]);
        this.showToast({severity: 'error', summary: expData.title})
        console.error(expData.title)
    }

    /**
     * Shows a toast with the error message
     * @param errData - the errorResponse
     */
    showError(errData: ErrorResponse) {
        this.showToast({severity: 'error', summary: errData.message});
        console.error(errData.details)
    }

    /**
     * Shows a toast that the site needs to be reloaded
     * @param reData - the restartResponse
     */
    showRestart(reData:RestartResponse) {
        this.showToast({severity: 'info', summary: 'Reload Page: ' + reData.info});
        console.warn(reData.info);
    }

    /**
     * 
     * @param languageData 
     */
    language(langData:LanguageResponse) {
        this.timeoutRequest(fetch(this.RESOURCE_URL + langData.languageResource), 2000)
        .then((response:any) => response.text())
        .then(value => parseString(value, (err, result) => { 
            result.properties.entry.forEach((entry:any) => this.contentStore.translation.set(entry.$.key, entry._));
            this.contentStore.emitTranslation();
        }))
    }

    /**
     * Decides if and where to the user should be routed based on all responses 
     * @param responses - the response array
     */
    routingDecider(responses: Array<BaseResponse>){
        let routeTo: string | undefined;
        let highestPriority = 0;

        responses.forEach(response => {
           if(response.name === RESPONSE_NAMES.USER_DATA){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo = "home";
               }
           }
           else if(response.name === RESPONSE_NAMES.SCREEN_GENERIC){
                const GResponse = (response as GenericResponse);
                const firstComp = (GResponse.changedComponents[0] as Panel)
                if(!GResponse.update && !firstComp.screen_modal_) {
                    if(highestPriority < 2){
                        highestPriority = 2;
                        routeTo = "home/" + this.contentStore.navigationNames.get(GResponse.componentId);
                    }
                }
           }
           else if(response.name === RESPONSE_NAMES.CLOSE_SCREEN) {
               const CSResponse = (response as CloseScreenResponse);
               let wasPopup:boolean = false;
               for (let entry of this.contentStore.flatContent.entries()) {
                   if (entry[1].name === CSResponse.componentId) {
                       this.contentStore.closeScreen(entry[1].name);
                       if ((entry[1] as Panel).screen_modal_)
                            wasPopup = true;
                   }
               }
               if(highestPriority < 1 && !wasPopup){
                   highestPriority = 1;
                   routeTo = "home";
               }
           }
           else if(response.name === RESPONSE_NAMES.LOGIN || response.name === RESPONSE_NAMES.SESSION_EXPIRED){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo = "login"
               }
           }
        //    else if (response.name === "settings") {
        //        routeTo = "home/settings";
        //    }
        });


        if(routeTo){
            window.location.hash = "/"+routeTo
            // history.push();//
        }
    }
}
export default Server