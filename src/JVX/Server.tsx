import ContentStore from "./ContentStore"
import * as queryString from "querystring";
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
import {createFetchRequest, createStartupRequest} from "./factories/RequestFactory";
import REQUEST_ENDPOINTS from "./request/REQUEST_ENDPOINTS";
import UploadResponse from "./response/UploadResponse";
import DownloadResponse from "./response/DownloadResponse";
import SessionExpiredResponse from "./response/SessionExpiredResponse";
import ErrorResponse from "./response/ErrorResponse";

type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

class Server{
    constructor(store: ContentStore) {
        this.contentStore = store
    }

    APP_NAME = ""
    BASE_URL = ""
    RESOURCE_URL = ""
    contentStore: ContentStore;
    showToast = (message: any) => {};
 
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

    timeoutRequest(promise: Promise<any>, ms: number){
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
        .set(RESPONSE_NAMES.ERROR, this.showError.bind(this));


    responseHandler(responses: Array<BaseResponse>){
        responses.forEach((responseObject: BaseResponse) => {
            const mapper = this.responseMap.get(responseObject.name);
            if(mapper){
                mapper(responseObject);
            }
        });

        this.routingDecider(responses);
    }

    //Application MetaData
    applicationMetaData(metaData: ApplicationMetaData){
        sessionStorage.setItem("clientId", metaData.clientId);
    }

    userData(userData: UserDataResponse){
        this.contentStore.currentUser = userData;
    }

    authenticationData(authData: AuthenticationDataResponse){
        localStorage.setItem("authKey", authData.authKey);
    }

    login(login: any){
        this.contentStore.reset();
    }


    //Content Responses
    generic(genericData: GenericResponse){
        this.contentStore.updateContent(genericData.changedComponents);
    }

    closeScreen(closeScreenData: CloseScreenResponse){
        this.contentStore.closeScreen(closeScreenData.componentId);
    }

    menu(menuData: MenuResponse){
        this.contentStore.buildMenuBar(menuData);
    }

    //Dal
    processRowSelection(selectedRowIndex: number | undefined, dataProvider: string){
        if(selectedRowIndex !== -1 && selectedRowIndex !== undefined) {
            const selectedRow = this.contentStore.getDataRow(dataProvider, selectedRowIndex);
            this.contentStore.setSelectedRow(dataProvider, selectedRow, selectedRowIndex);
            this.contentStore.emitRowSelect(dataProvider);
        } else if(selectedRowIndex === -1) {
            this.contentStore.clearSelectedRow(dataProvider);
            this.contentStore.emitRowSelect(dataProvider);
        }
    }

    processFetch(fetchData: FetchResponse){
        const builtData = fetchData.records.map(record => {
            const data : any = {}
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            return data;
        });
        this.contentStore.dataProviderFetched.set(fetchData.dataProvider, fetchData.isAllFetched);
        if(fetchData.records.length !== 0)
            this.contentStore.updateDataProviderData(fetchData.dataProvider, builtData, fetchData.to, fetchData.from);
        else
            this.contentStore.notifyDataChange(fetchData.dataProvider);
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider);
    }

    processDataProviderChanged(changedProvider: DataProviderChangedResponse){
        if(changedProvider.reload === -1) {
            this.contentStore.clearDataFromProvider(changedProvider.dataProvider);
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = changedProvider.dataProvider;
            this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        } else if(changedProvider.reload !== undefined) {
            const fetchReq = createFetchRequest();
            fetchReq.rowCount = 1;
            fetchReq.fromRow = changedProvider.reload;
            fetchReq.dataProvider = changedProvider.dataProvider;
            this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH
            )
        }
        else {
            const fetchReq = createFetchRequest();
            fetchReq.rowCount = 1;
            fetchReq.fromRow = 0;
            fetchReq.dataProvider = changedProvider.dataProvider;
            this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
        }
        this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider);
    }

    processMetaData(metaData: MetaDataResponse){
        this.contentStore.dataProviderMetaData.set(metaData.dataProvider, metaData);
    }

    //Down- & UpLoad

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

    download(downloadData: DownloadResponse){
        const a = document.createElement('a');
        a.href = downloadData.url.split(';')[0];
        a.setAttribute('download', downloadData.fileName);
        a.click();
    }

    //Show Document
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
        this.contentStore.flatContent.clear();
        this.contentStore.removedContent.clear();
        this.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
        this.routingDecider([expData]);
        this.showToast({severity: 'error', summary: expData.title})
        console.error(expData.title)
    }

    showError(errData: ErrorResponse) {
        this.showToast({severity: 'error', summary: errData.message});
        console.error(errData.details)
    }

    //Decides if and where to the user should be routed based on all responses
    routingDecider(responses: Array<BaseResponse>){
        let routeTo: string | undefined;
        let highestPriority = 0;

        responses.forEach(response => {
           if(response.name === RESPONSE_NAMES.USER_DATA){
               if(highestPriority < 1){
                   highestPriority = 1;
                   routeTo="home";
               }
           }
           else if(response.name === RESPONSE_NAMES.SCREEN_GENERIC){
                const GResponse = (response as GenericResponse);
                if(!GResponse.update){
                    if(highestPriority < 2){
                        highestPriority = 2;
                        routeTo = "home/"+GResponse.componentId;
                    }
                }
           }
           else if(response.name === RESPONSE_NAMES.CLOSE_SCREEN){
               if(highestPriority < 1){
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
           else if (response.name === "settings") {
               routeTo = "home/settings";
           }
        });


        if(routeTo){
            window.location.hash = "/"+routeTo
            // history.push();//
        }
    }
}
export default Server