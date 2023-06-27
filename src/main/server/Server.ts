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

import {parseString} from "xml2js"
import ContentStore from "../contentstore/ContentStore"
import BaseServer from "./BaseServer";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import RESPONSE_NAMES from "../response/RESPONSE_NAMES";
import BaseResponse from "../response/BaseResponse";
import ApplicationMetaDataResponse from "../response/app/ApplicationMetaDataResponse";
import ApplicationParametersResponse from "../response/app/ApplicationParametersResponse";
import UserDataResponse from "../response/login/UserDataResponse";
import AuthenticationDataResponse from "../response/login/AuthenticationDataResponse";
import LoginResponse from "../response/login/LoginResponse";
import GenericResponse from "../response/ui/GenericResponse";
import { IPanel } from "../components/panels/panel/UIPanel";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import CloseScreenResponse from "../response/ui/CloseScreenResponse";
import MenuResponse, { ServerMenuButtons } from "../response/data/MenuResponse";
import UploadResponse from "../response/data/UploadResponse";
import DownloadResponse from "../response/data/DownloadResponse";
import ShowDocumentResponse from "../response/event/ShowDocumentResponse";
import ErrorResponse from "../response/error/ErrorResponse";
import MessageResponse from "../response/ui/MessageResponse";
import DialogResponse from "../response/ui/DialogResponse";
import RestartResponse from "../response/error/RestartResponse";
import LanguageResponse from "../response/event/LanguageResponse";
import ApplicationSettingsResponse from "../response/app/ApplicationSettingsResponse";
import WelcomeDataResponse from "../response/ui/WelcomeDataResponse";
import CloseFrameResponse from "../response/ui/CloseFrameResponse";
import ContentResponse from "../response/ui/ContentResponse";
import CloseContentResponse from "../response/ui/CloseContentResponse";
import { indexOfEnd } from "../util/string-util/IndexOfEnd";
import { History } from "history";
import { createOpenScreenRequest } from "../factories/RequestFactory";
import { getNavigationIncrement } from "../util/other-util/GetNavigationIncrement";
import { translation } from "../util/other-util/Translation";
import { overwriteLocaleValues, setDateLocale, setPrimeReactLocale } from "../util/other-util/GetDateLocale";
import BaseComponent from "../util/types/BaseComponent";
import DispatchActionRequest from "../request/events/DispatchActionRequest";

/** Enum for server request endpoints */
enum REQUEST_ENDPOINTS {
    //application/UI
    STARTUP = "/api/v5/startup",
    UI_REFRESH = "/api/uiRefresh",
    DEVICE_STATUS = "/api/deviceStatus",
    CLOSE_FRAME = "/api/closeFrame",
    OPEN_SCREEN = "/api/v3/openScreen",
    CLOSE_SCREEN = "/api/closeScreen",
    CLOSE_CONTENT = "/api/closeContent",
    REOPEN_SCREEN = "/api/v3/reopenScreen",
    ABOUT = "/api/about",
    MENU = "/api/menu",

    //login/account-management
    LOGIN = "/api/v2/login",
    LOGOUT = "/api/logout",
    CHANGE_PASSWORD = "/api/changePassword",
    RESET_PASSWORD = "/api/resetPassword",
    CANCEL_LOGIN = "/api/cancelLogin",

    //events
    PRESS_BUTTON = "/api/v2/pressButton",
    MOUSE_CLICKED = "/api/mouseClicked",
    MOUSE_PRESSED = "/api/mousePressed",
    MOUSE_RELEASED = "/api/mouseReleased",
    FOCUS_GAINED = "/api/focusGained",
    FOCUS_LOST = "/api/focusLost",
    
    //upload
    UPLOAD = "/upload",

    //data
    METADATA = "/api/dal/metaData",
    FETCH = "/api/dal/fetch",
    SELECT_ROW = "/api/dal/selectRecord",
    SELECT_TREE = "/api/dal/selectRecordTree",
    SELECT_COLUMN = "/api/dal/selectColumn",
    DELETE_RECORD = "/api/dal/deleteRecord",
    INSERT_RECORD = "/api/dal/insertRecord",
    SET_VALUES = "/api/dal/setValues",
    FILTER = "/api/dal/filter",
    DAL_SAVE = "/api/dal/save",
    SORT = "/api/dal/sort",
    WIDTH = "/api/dal/width",

    //comp
    SET_VALUE = "/api/comp/setValue",
    SELECT_TAB = "/api/comp/selectTab",
    CLOSE_TAB = "/api/comp/closeTab",
    CLOSE_POPUP_MENU = "/api/comp/closePopupMenu ",
    
    //other
    SAVE = "/api/save",
    SET_SCREEN_PARAMETER = "/api/setScreenParameter",
    RELOAD = "/api/reload",
    ROLLBACK = "/api/rollback",
    CHANGES = "/api/changes",
    ALIVE = "/api/alive",
    EXIT = "/api/exit"
}

/** Server class sends requests and handles responses */
class Server extends BaseServer {
    // Function which can be set by lib users, gets executed when the menu response is received
    onMenuFunction:Function = () => {};

    // Function which can be set by lib users, gets executed screens are opened
    onOpenScreenFunction:Function = () => {};

    // Function which can be set by lib users, gets executed when the login response is received
    onLoginFunction:Function = () => {};

    // True, if the last closed screen was a popup
    lastClosedWasPopUp = false;

    noWelcomeRoute = false;

    // Sets the onMenu Function
    setOnMenuFunction(fn:Function) {
        this.onMenuFunction = fn;
    }

    // Sets the onOpenScreen Function
    setOnOpenScreenFunction(fn:Function) {
        this.onOpenScreenFunction = fn;
    }

    // Sets the onLoginFunction
    setOnLoginFunction(fn:Function) {
        this.onLoginFunction = fn;
    }

    /**
     * Returns true if the component exists
     * @param name - the name of the component
     */
    componentExists(name:string) {
        const comp = this.contentStore.getComponentByName(name);
        if (comp && comp.visible !== false && comp.invalid !== true) {
            let parent = comp.parent;
            while (parent && !parent.includes("IF")) {
                if (this.contentStore.getComponentById(parent) && this.contentStore.getComponentById(parent)!.visible !== false) {
                    parent = this.contentStore.getComponentById(parent)!.parent
                }
                else {
                    return false;
                }
            }
            return true;
        }

        if ((this.contentStore as ContentStore).dialogButtons.includes(name)) {
            return true;
        }

        return false;
    }

    /** ----------SENDING-REQUESTS---------- */

    // A Map which contains the request-keyword as key and the server endpoint as value
    endpointMap = new Map<string, string>()
    .set(REQUEST_KEYWORDS.OPEN_SCREEN, REQUEST_ENDPOINTS.OPEN_SCREEN)
    .set(REQUEST_KEYWORDS.CLOSE_SCREEN, REQUEST_ENDPOINTS.CLOSE_SCREEN)
    .set(REQUEST_KEYWORDS.CLOSE_CONTENT, REQUEST_ENDPOINTS.CLOSE_CONTENT)
    .set(REQUEST_KEYWORDS.REOPEN_SCREEN, REQUEST_ENDPOINTS.REOPEN_SCREEN)
    .set(REQUEST_KEYWORDS.LOGIN, REQUEST_ENDPOINTS.LOGIN)
    .set(REQUEST_KEYWORDS.LOGOUT, REQUEST_ENDPOINTS.LOGOUT)
    .set(REQUEST_KEYWORDS.CHANGE_PASSWORD, REQUEST_ENDPOINTS.CHANGE_PASSWORD)
    .set(REQUEST_KEYWORDS.RESET_PASSWORD, REQUEST_ENDPOINTS.RESET_PASSWORD)
    .set(REQUEST_KEYWORDS.UPLOAD, REQUEST_ENDPOINTS.UPLOAD)
    .set(REQUEST_KEYWORDS.SAVE, REQUEST_ENDPOINTS.SAVE)
    .set(REQUEST_KEYWORDS.SET_SCREEN_PARAMETER, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER)
    .set(REQUEST_KEYWORDS.RELOAD, REQUEST_ENDPOINTS.RELOAD)
    .set(REQUEST_KEYWORDS.ROLLBACK, REQUEST_ENDPOINTS.ROLLBACK)
    .set(REQUEST_KEYWORDS.CHANGES, REQUEST_ENDPOINTS.CHANGES)
    .set(REQUEST_KEYWORDS.STARTUP, REQUEST_ENDPOINTS.STARTUP)
    .set(REQUEST_KEYWORDS.UI_REFRESH, REQUEST_ENDPOINTS.UI_REFRESH)
    .set(REQUEST_KEYWORDS.DEVICE_STATUS, REQUEST_ENDPOINTS.DEVICE_STATUS)
    .set(REQUEST_KEYWORDS.CLOSE_FRAME, REQUEST_ENDPOINTS.CLOSE_FRAME)
    .set(REQUEST_KEYWORDS.PRESS_BUTTON, REQUEST_ENDPOINTS.PRESS_BUTTON)
    .set(REQUEST_KEYWORDS.MOUSE_CLICKED, REQUEST_ENDPOINTS.MOUSE_CLICKED)
    .set(REQUEST_KEYWORDS.MOUSE_PRESSED, REQUEST_ENDPOINTS.MOUSE_PRESSED)
    .set(REQUEST_KEYWORDS.MOUSE_RELEASED, REQUEST_ENDPOINTS.MOUSE_RELEASED)
    .set(REQUEST_KEYWORDS.FOCUS_GAINED, REQUEST_ENDPOINTS.FOCUS_GAINED)
    .set(REQUEST_KEYWORDS.FOCUS_LOST, REQUEST_ENDPOINTS.FOCUS_LOST)
    .set(REQUEST_KEYWORDS.METADATA, REQUEST_ENDPOINTS.METADATA)
    .set(REQUEST_KEYWORDS.FETCH, REQUEST_ENDPOINTS.FETCH)
    .set(REQUEST_KEYWORDS.SELECT_ROW, REQUEST_ENDPOINTS.SELECT_ROW)
    .set(REQUEST_KEYWORDS.SELECT_TREE, REQUEST_ENDPOINTS.SELECT_TREE)
    .set(REQUEST_KEYWORDS.SELECT_COLUMN, REQUEST_ENDPOINTS.SELECT_COLUMN)
    .set(REQUEST_KEYWORDS.DELETE_RECORD, REQUEST_ENDPOINTS.DELETE_RECORD)
    .set(REQUEST_KEYWORDS.INSERT_RECORD, REQUEST_ENDPOINTS.INSERT_RECORD)
    .set(REQUEST_KEYWORDS.SET_VALUES, REQUEST_ENDPOINTS.SET_VALUES)
    .set(REQUEST_KEYWORDS.FILTER, REQUEST_ENDPOINTS.FILTER)
    .set(REQUEST_KEYWORDS.DAL_SAVE, REQUEST_ENDPOINTS.DAL_SAVE)
    .set(REQUEST_KEYWORDS.SORT, REQUEST_ENDPOINTS.SORT)
    .set(REQUEST_KEYWORDS.SET_VALUE, REQUEST_ENDPOINTS.SET_VALUE)
    .set(REQUEST_KEYWORDS.SELECT_TAB, REQUEST_ENDPOINTS.SELECT_TAB)
    .set(REQUEST_KEYWORDS.CLOSE_TAB, REQUEST_ENDPOINTS.CLOSE_TAB)
    .set(REQUEST_KEYWORDS.CLOSE_POPUP_MENU, REQUEST_ENDPOINTS.CLOSE_POPUP_MENU)
    .set(REQUEST_KEYWORDS.CANCEL_LOGIN, REQUEST_ENDPOINTS.CANCEL_LOGIN)
    .set(REQUEST_KEYWORDS.ALIVE, REQUEST_ENDPOINTS.ALIVE)
    .set(REQUEST_KEYWORDS.EXIT, REQUEST_ENDPOINTS.EXIT)
    .set(REQUEST_KEYWORDS.ABOUT, REQUEST_ENDPOINTS.ABOUT)
    .set(REQUEST_KEYWORDS.MENU, REQUEST_ENDPOINTS.MENU)
    .set(REQUEST_KEYWORDS.WIDTH, REQUEST_ENDPOINTS.WIDTH);

    /** ----------HANDLING-RESPONSES---------- */

    /** A Map which checks which function needs to be called when a response is received, for data responses */
    dataResponseMap = new Map<string, Function>()
    .set(RESPONSE_NAMES.DAL_FETCH, this.processFetch.bind(this))
    .set(RESPONSE_NAMES.DAL_META_DATA, this.processMetaData.bind(this))
    .set(RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED, this.processDataProviderChanged.bind(this))


    /** A Map which checks which function needs to be called when a response is received */
    responseMap = new Map<string, Function>()
        .set(RESPONSE_NAMES.USER_DATA, this.userData.bind(this))
        .set(RESPONSE_NAMES.AUTHENTICATION_DATA, this.authenticationData.bind(this))
        .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
        .set(RESPONSE_NAMES.MENU, this.menu.bind(this))
        .set(RESPONSE_NAMES.SCREEN_GENERIC, this.generic.bind(this))
        .set(RESPONSE_NAMES.CLOSE_SCREEN, this.closeScreen.bind(this))
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
        .set(RESPONSE_NAMES.CLOSE_CONTENT, this.closeContent.bind(this))
        .set(RESPONSE_NAMES.BAD_CLIENT, this.badClient.bind(this))

    /**
     * Calls the correct functions based on the responses received and then calls the routing decider
     * @param responses - the responses received
     */
    async responseHandler(responses: Array<BaseResponse>, request: any) {
        if (Array.isArray(responses)) {
            await super.responseHandler(responses, request);
            // if there is a screen to close don't route to prevent flickering
            if (!this.screensToClose.length) {
                this.routingDecider(responses);
            }
            
            // Cleans up the flatcontent and dataproviders after closing a screen
            const cleanUpScreen = (screenToClose: {windowId: string, windowName: string, closeDirectly: boolean|undefined}) => {
                if (this.screensToClose.length) {
                    let window = this.contentStore.getComponentById(screenToClose.windowId);
                    if (window) {
                        this.contentStore.cleanUpUI(window.id, window.name, window.className, screenToClose.closeDirectly);
                    }
                    this.screensToClose.splice(this.screensToClose.findIndex(screen => screen.windowId === screenToClose.windowId), 1);
                }
            }
            
            // If there is a screen to close check if a previous screen needs to be opened then open the screen and after that clean up the closed screen to prevent flickering
            if (this.screensToClose.length) {
                if (this.maybeOpenScreen && !this.contentStore.activeScreens.length) {
                    if (!this.screensToClose.some(screenToClose => screenToClose.windowName === this.maybeOpenScreen!.componentId)) {
                        this.api.sendOpenScreenRequest(this.maybeOpenScreen.className).then(() => this.screensToClose.forEach(screenToClose => cleanUpScreen(screenToClose)));
                    }
                    this.maybeOpenScreen = undefined;
                }
                else {
                    // if there is no screen to open clean up, update active screens and route
                    this.screensToClose.forEach(screenToClose => cleanUpScreen(screenToClose))
                    this.subManager.emitActiveScreens();
                    this.routingDecider(responses);
                }
            }
        }
        return responses
    }

    /**
     * Sets the clientId in the sessionStorage
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
    }

    /**
     * Calls contentStores handleCustomProperties for every applicationParameter 
     * @param appParams - the applicationParametersResponse
     */
    applicationParameters(appParams:ApplicationParametersResponse) {
        for (const [key, value] of Object.entries(appParams)) {
            if (["name", "Application_title_web", "Application_title_name"].indexOf(key) === -1) {
                (this.contentStore as ContentStore).handleCustomProperties(key, value);
            }
        }

        if (appParams.Application_title_web) {
            this.contentStore.tabTitle = appParams.Application_title_web;
            this.subManager.notifyTabTitleChanged(appParams.Application_title_web);
        }

        if (appParams.Application_title_name) {
            this.contentStore.topbarTitle = appParams.Application_title_name;
            this.subManager.notifyScreenTitleChanged(appParams.Application_title_name); 
        }
    }

    /**
     * Sets the currentUser in contentStore
     * @param userData - the userDataResponse
     */
    userData(userData: UserDataResponse) {
        (this.contentStore as ContentStore).currentUser = userData;
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
        this.loginError = login.errorMessage;
        this.appSettings.setLoginProperties(login.mode, login.errorMessage);

        if (login.mode === "mFWait") {
            if (login.confirmationCode !== undefined && login.timeout) {
                this.subManager.emitMFAWaitChanged(login.confirmationCode, login.timeout, login.timeoutReset);
            }
        }

        if (login.mode === "mFURL") {
            if (login.link && login.timeout) {
                this.subManager.emitMFAURLChanged(login.link, login.timeout, login.timeoutReset);
            }
        }

        if (login.username) {
            (this.contentStore as ContentStore).currentUser.userName = login.username;
        }

        this.contentStore.reset();
    }


    /**
     * Calls the contentStore updateContent function 
     * @param genericData - the genericResponse
     */
    generic(genericData: GenericResponse) {
        // Set the homescreen if home is true
        if (this.appSettings.homeScreen === undefined && genericData.home) {
            this.appSettings.homeScreen = genericData.componentId;
        }

        // If there is another screen to open after a close() ignore the generic command if the homescreen would be opened.
        if (!(genericData.home && this.ignoreHome) || this.homeButtonPressed) {
            const openScreen = () => {
                if (genericData.changedComponents && genericData.changedComponents.length) {
                    this.contentStore.updateContent(genericData.changedComponents, false);
                }
                if (!genericData.update) {
                    let workScreen:IPanel|undefined
                    if(genericData.changedComponents && genericData.changedComponents.length) {
                        if (genericData.changedComponents[0].className === COMPONENT_CLASSNAMES.PANEL) {
                            workScreen = genericData.changedComponents[0] as IPanel;
        
                            /** 
                             * If the component has a navigation-name check, if the navigation-name already exists if it does, add a number
                             * to the navigation-name, if not, don't add anything, and call setNavigationName
                             */
                            if (workScreen.screen_navigationName_) {
                                const increment = getNavigationIncrement(workScreen.screen_navigationName_, this.contentStore.navigationNames);
                                if (workScreen.screen_navigationName_ + increment === this.linkOpen) {
                                    this.linkOpen = "";
                                }
                                if (this.contentStore.navigationNames.has(workScreen.screen_navigationName_ + increment)) {
                                    const foundNavName = this.contentStore.navigationNames.get(workScreen.screen_navigationName_ + increment) as { screenId: string, componentId: string };
                                    foundNavName.screenId = workScreen.name;
                                }
                                else {
                                    this.contentStore.setNavigationName(workScreen.screen_navigationName_ + increment, workScreen.screen_className_ as string, workScreen.name);
                                }
                            }
    
                            if (workScreen.screen_title_) {
                                this.contentStore.topbarTitle = workScreen.screen_title_;
                                //this.subManager.notifyScreenTitleChanged(workScreen.screen_title_);
                            }
                            this.contentStore.setActiveScreen({ 
                                name: genericData.componentId, 
                                id: workScreen ? workScreen.id : "", 
                                className: workScreen ? workScreen.screen_className_ : "", 
                                title: workScreen.screen_title_,
                                navigationName: workScreen.screen_navigationName_
                            }, workScreen ? workScreen.screen_modal_ : false);
        
                            // if (workScreen.screen_modal_ && this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2] && this.contentStore.getScreenDataproviderMap(this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2].name)) {
                            //     this.contentStore.dataBooks.set(workScreen.name, this.contentStore.getScreenDataproviderMap(this.contentStore.activeScreens[this.contentStore.activeScreens.length - 2].name) as Map<string, IDataBook>);
                            // }
                        }
                    }
                    this.onOpenScreenFunction();
                }
            }
    
            // If there is a welcome screen and it hasnt been opened yet
            if (this.appSettings.welcomeScreen.name && !this.appSettings.welcomeScreen.initOpened) {
                const pathName = (this.history as History).location.pathname as string;
                // If there is a screen to open because there is a navigation-name set at the very beginning (url), open it.
                const screenToOpen = this.contentStore.navigationNames.get(pathName.replaceAll("/", "").substring(indexOfEnd(pathName, "screens") - 1))?.componentId;
                // Check if the url screen to open is the welcome screen or the response is a home screen and there is no screen to open via url or the screen cant be found in the navigationnames
                if ((screenToOpen && screenToOpen.split(":")[0] === this.appSettings.welcomeScreen.name) || ((genericData.home || genericData.welcome) && (!this.linkOpen || !screenToOpen))) {
                    openScreen()
                }
                else {
                    this.noWelcomeRoute = true;
                }
                this.appSettings.welcomeScreen.initOpened = true;
            }
            else {
                openScreen();
            }
        }
        else {
            this.ignoreHome = false;
        }
    }

    //Either opens the basic "home" or a welcome screen if there is one.
    routeToHome() {
        this.contentStore.setActiveScreen();
        this.history?.push('/home');
        return Promise.resolve(true);
    }

    /**
     * Close Screen handling
     * @param closeScreenData - the close screen response 
     */
    closeScreen(closeScreenData: CloseScreenResponse) {
        let id = "";
        for (let entry of this.contentStore.flatContent.entries()) {
            if (entry[1].name === closeScreenData.componentId) {
                id = entry[1].id;
                if ((entry[1] as IPanel).screen_modal_) {
                    this.lastClosedWasPopUp = true;
                }
                else {
                    this.lastClosedWasPopUp = false;
                }
                break
            }
        }

        // for (let entry of this.contentStore.removedContent.entries()) {
        //     if (entry[1].contentParentName === closeScreenData.componentId) {
        //         this.contentStore.cleanUp(entry[1].id, entry[1].name, entry[1].className, true);
        //         this.contentStore.flatContent.delete(entry[1].id + "-popup");
        //     }
        // }
        // If there have been more than two screens opened in the application, remember the last closed screen
        if (this.contentStore.screenHistory.length > 1) {
            const screen = this.contentStore.screenHistory[this.contentStore.screenHistory.length - 2]
            this.maybeOpenScreen = { className: screen.className, componentId: screen.componentId};
        }

        if (this.contentStore.inactiveScreens.includes(closeScreenData.componentId)) {
            this.contentStore.inactiveScreens = this.contentStore.inactiveScreens.filter(inactiveScreen => inactiveScreen !== closeScreenData.componentId)
        }

        this.contentStore.closeScreen(id, closeScreenData.componentId);
    }

    /**
     * Sets the menuAction for each menuData and passes it to the contentstore and then triggers its update
     * @param menuData - the menuResponse
     */
    menu(menuData: MenuResponse) {
        if (menuData.entries && menuData.entries.length) {
            (this.contentStore as ContentStore).menuItems = new Map<string, ServerMenuButtons[]>()
            menuData.entries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                (this.contentStore as ContentStore).addMenuItem(entry);
            });
        }
        if (menuData.toolBarEntries && menuData.toolBarEntries.length) {
            menuData.toolBarEntries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                (this.contentStore as ContentStore).addToolbarItem(entry);
            })
        }
        this.onMenuFunction();
        this.subManager.emitMenuUpdate();
        this.subManager.emitToolBarUpdate();
    }

    //Dal

    /**
     * Returns the current screen-name
     * @param dataProvider 
     * @returns 
     */
    getScreenName(dataProvider:string) {
        // if (this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1]) {
        //     const activeScreen = this.contentStore.getComponentByName(this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name);
        //     if (activeScreen && (activeScreen as IPanel).content_modal_ !== true) {
        //         return this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;
        //     }
        // }
        if (dataProvider) {
            return dataProvider.split("/")[1];
        }
        return ""
    }

    //Down- & UpLoad

    /**
     * Opens a fileSelectDialog and sends the selected file to the server
     * @param uploadData - the uploadResponse
     */
    upload(uploadData: UploadResponse, request:DispatchActionRequest) {
        if (!request || !request.isUploadButton) {
            try {
                const inputElem = document.createElement('input');
                inputElem.type = 'file';
                //@ts-ignore
                inputElem.showPicker();
                inputElem.onchange = (e) => {
                    const formData = new FormData();
                    formData.set("clientId", sessionStorage.getItem("clientId") || "")
                    formData.set("fileId", uploadData.fileId)
                    // @ts-ignore
                    formData.set("data", e.target.files[0])
                    this.sendRequest({ upload: true, formData: formData }, REQUEST_KEYWORDS.UPLOAD)
                }
            }
            catch(e) {
                console.log("showpicker function not supported")
            }
        }
        else {
            if (request && request.componentId) {
                const inputElem = document.getElementById(request.componentId + "-upload");
                if (inputElem) {
                    inputElem.setAttribute("upload-file-id", uploadData.fileId);
                }
            }

        }
    }

    /**
     * Downloads the file
     * @param downloadData - the downloadResponse
     */
    download(downloadData: DownloadResponse) {
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
        let splitURL:string[] = [];
        if (showData.url.startsWith('"')) {
            a.href = showData.url.substring(1, showData.url.lastIndexOf('"'));
            splitURL = showData.url.substring(showData.url.lastIndexOf('"')).split(';');
        }
        else {
            let splitURL = showData.url.split(';')
            a.href = splitURL[0];
        }
        a.setAttribute('target', splitURL[2]);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Shows a toast with the error message
     * @param errData - the errorResponse
     */
    showError(errData: ErrorResponse) {
        if (!errData.silentAbort) {
            this.subManager.emitErrorDialogProperties(errData);
        }
        console.error(errData.details)
    }

    /** Shows an info toast */
    showInfo(infoData: MessageResponse) {
        this.subManager.emitToast(infoData, "error");
    }

    /** Sets the dialogbutton-component-ids and shows the dialog */
    showMessageDialog(dialogData:DialogResponse) {
        (this.contentStore as ContentStore).dialogButtons = [];
        if (dialogData.okComponentId) {
            (this.contentStore as ContentStore).dialogButtons.push(dialogData.okComponentId);
        }
        
        if (dialogData.cancelComponentId) {
            (this.contentStore as ContentStore).dialogButtons.push(dialogData.cancelComponentId);
        }

        if (dialogData.notOkComponentId) {
            (this.contentStore as ContentStore).dialogButtons.push(dialogData.notOkComponentId);
        }

        this.subManager.emitMessageDialog(dialogData);
    }
 
    /**
     * Shows a toast that the site needs to be reloaded
     * @param reData - the restartResponse
     */
    showRestart(reData:RestartResponse) {
        this.subManager.emitToast({ message: 'Reload Page: ' + reData.info, name: "" }, "error")
        console.warn(reData.info);
    }

    /**
     * Fetches the languageResource and fills the translation map
     * @param langData - the language data
     */
    async language(langData:LanguageResponse) {
        if (langData.languageResource && !this.errorIsDisplayed) {
            if (!this.translationFetched) {
                await this.timeoutRequest(fetch(this.RESOURCE_URL + langData.languageResource), this.timeoutMs)
                .then((response:any) => response.text())
                .then(value => parseString(value, (err, result) => { 
                    if (result) {
                        if (result.properties) {
                            // After fetching the translation, fill the translation map, overwrite and set the locals and set translation appready param true
                            result.properties.entry.forEach((entry:any) => translation.set(entry.$.key, entry._))
                        }
                        overwriteLocaleValues(langData.langCode ? langData.langCode : "en");
                        setPrimeReactLocale();
                        this.appSettings.setAppReadyParam("translation");
                        this.translationFetched = true;
                    }
                }));
            }
        }
        else {
            this.subManager.emitErrorBarProperties(true, false, false, 5, "Could not load translation", "There was a problem when fetching the translation");
            this.subManager.emitErrorBarVisible(true);
        }

        if (langData.langCode) {
            this.appSettings.locale = langData.langCode;
            setDateLocale(langData.langCode)
        }

        if (langData.timeZoneCode) {
            this.appSettings.timeZone = langData.timeZoneCode;
        }
    }

    /** 
     * Sets the application-settings and notifies the subscribers
     * @param appSettings
     */
    applicationSettings(appSettings:ApplicationSettingsResponse) {
        this.appSettings.setVisibleButtons(appSettings.reload, appSettings.rollback, appSettings.save, appSettings.home);
        this.appSettings.setChangePasswordEnabled(appSettings.changePassword);
        this.appSettings.setMenuOptions(appSettings.menuBar, appSettings.toolBar, appSettings.userSettings, appSettings.logout);
        if (appSettings.desktop && appSettings.desktop.length) {
            if (appSettings.desktop[0].className === COMPONENT_CLASSNAMES.DESKTOPPANEL) {
                this.appSettings.setDesktopPanel(appSettings.desktop[0]);
            }
            this.contentStore.updateContent(appSettings.desktop, true);
        }
        this.subManager.emitAppSettings();
    }

    /**
     * Sets the welcome-screen in app-settings
     * @param welcomeData - the welcome-data response
     */
    welcomeData(welcomeData:WelcomeDataResponse) {
        this.appSettings.setWelcomeScreen(welcomeData.homeScreen);
    }

    // Closes a frame
    closeFrame(closeFrameData:CloseFrameResponse) {
        // TODO: change dialogButtons to map with key as componentId of dialog and values buttons
        // then delete the componentId key of closeFrameData
        (this.contentStore as ContentStore).dialogButtons = [];
        this.subManager.emitCloseFrame();
    }

    // Opens a content by calling the contentstores updatecontent method to add it to the flatcontent and updating the active-screens
    content(contentData:ContentResponse) {
        let workScreen:IPanel|undefined = contentData.changedComponents[0] as IPanel
        if (contentData.changedComponents && contentData.changedComponents.length) {
            if (this.contentStore.activeScreens[0]) {
                workScreen.contentParentName = this.contentStore.activeScreens[0].name
            }
            this.contentStore.updateContent(contentData.changedComponents, false);
        }
        if (!contentData.update) {
            if(contentData.changedComponents && contentData.changedComponents.length) {
                this.contentStore.setActiveScreen({ name: workScreen.name, id: workScreen ? workScreen.id : "", className: workScreen ? workScreen.content_className_ : "" }, workScreen ? workScreen.content_modal_ : false);
            }
        }
        else {
            if (this.contentStore.getComponentById(contentData.changedComponents[0].id)) {
                workScreen = this.contentStore.getComponentById(contentData.changedComponents[0].id) as IPanel;
                if (workScreen.content_modal_) {
                    this.contentStore.setActiveScreen({ name: workScreen.name, id: workScreen ? workScreen.id : "", className: workScreen ? workScreen.content_className_ : "" }, workScreen ? workScreen.content_modal_ : false);
                }
            }
        }
    }

    // Closes a content
    closeContent(closeContentData:CloseContentResponse) {
        if (closeContentData.componentId) {
            const comp = this.contentStore.getComponentByName(closeContentData.componentId)
            if (comp) {
                this.contentStore.updateContent([{ id: comp.id, "~remove": true } as BaseComponent], false)
            }
            
            //this.contentStore.closeScreen(closeContentData.componentId, true);

            this.contentStore.activeScreens = this.contentStore.activeScreens.filter(screen => screen.name !== closeContentData.componentId);
            this.subManager.emitActiveScreens();
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
        const pathName = (this.history as History).location.pathname as string

        responses.forEach(response => {
            if (response.name === RESPONSE_NAMES.USER_DATA) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    // If there is a screen to open because there is a navigation-name set at the very beginning (url), open it.
                    const screenToOpen = this.contentStore.navigationNames.get(pathName.replaceAll("/", "").substring(indexOfEnd(pathName, "screens") - 1))?.componentId;
                    const alreadyOpened = this.contentStore.activeScreens.some(screen => screen.className === screenToOpen?.split(":")[0]);
                    if (!alreadyOpened) {
                        if (pathName.includes("screens") && screenToOpen) {
                            const req = createOpenScreenRequest();
                            req.componentId = screenToOpen;
                            this.sendRequest(req, REQUEST_KEYWORDS.OPEN_SCREEN);
                        }
                        else if (pathName === "/login" && this.linkOpen && this.contentStore.navigationNames.has(this.linkOpen)) {
                            const req = createOpenScreenRequest();
                            req.componentId = this.contentStore.navigationNames.get(this.linkOpen)!.componentId;
                            this.sendRequest(req, REQUEST_KEYWORDS.OPEN_SCREEN);
                        }
                        else {
                            routeTo = "home";
                        }
                    }
                }
                this.appSettings.setAppReadyParam("userOrLogin");
            }
            else if (response.name === RESPONSE_NAMES.SCREEN_GENERIC) {
                const GResponse = (response as GenericResponse);
                let firstComp;
                if (GResponse.changedComponents && GResponse.changedComponents.length) {
                    firstComp = GResponse.changedComponents[0] as IPanel
                }
                
                if (!GResponse.update && firstComp && firstComp.screen_navigationName_ && !firstComp.screen_modal_) {
                    const increment = getNavigationIncrement(firstComp.screen_navigationName_, this.contentStore.navigationNames);
                    if (highestPriority < 2 
                        && this.contentStore.navigationNames.has(firstComp.screen_navigationName_ + increment)
                        && (!this.linkOpen || this.linkOpen === firstComp.screen_navigationName_ + increment)
                        && !this.noWelcomeRoute) {
                        highestPriority = 2;
                        routeTo = "screens/" + firstComp.screen_navigationName_ + increment;
                    }
                    else if (this.noWelcomeRoute) {
                        this.noWelcomeRoute = false;
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
                    this.contentStore.flatContent.forEach((value:any) => {
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
        });
        if (routeTo) {
            //window.location.hash = "/"+routeTo
            this.history?.push(`/${routeTo}`);
        }
    }
}
export default Server