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

import React, { createContext, FC, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import Server from "../server/Server";
import ContentStore from "../contentstore/ContentStore";
import { SubscriptionManager } from "../SubscriptionManager";
import API from "../API";
import AppSettings from "../AppSettings";
import { createAliveRequest,
         createBaseRequest,
         createChangesRequest,
         createOpenScreenRequest,
         createStartupRequest,
         createUIRefreshRequest,
         getClientId } from "../factories/RequestFactory";
import { Designer, ICustomContent } from "../../MiddleMan";
import { showTopBar } from "../components/topbar/TopBar";
import ContentStoreFull from "../contentstore/ContentStoreFull";
import ServerFull from "../server/ServerFull";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import UIRefreshRequest from "../request/application-ui/UIRefreshRequest";
import StartupRequest from "../request/application-ui/StartupRequest";
import { addCSSDynamically } from "../util/html-util/AddCSSDynamically";
import RESPONSE_NAMES from "../response/RESPONSE_NAMES";
import useEventHandler from "../hooks/event-hooks/useEventHandler";
import Timer from "../util/other-util/Timer";
import { indexOfEnd } from "../util/string-util/IndexOfEnd";
import { DesignerSubscriptionManager } from "../DesignerSubscriptionManager";
import BaseResponse from "../response/BaseResponse";
import { translation } from "../util/other-util/Translation";
import { initialURL } from "../util/InitialURL";

/** Checks if the contentstore is for transfermode full */
export function isV2ContentStore(contentStore: ContentStore | ContentStoreFull): contentStore is ContentStore {
    return (contentStore as ContentStore).menuItems !== undefined;
}

/**
 * Returns true, if the designer is currently visible
 * @param designer - the designer instance or null
 */
export function isDesignerVisible(designer: Designer|null) {
    if (designer) {
        return designer.isVisible;
    }
    return false;
}

/** Type for AppContext */
export type AppContextType = {
    transferType: "partial",
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    designerSubscriptions: DesignerSubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
    appReady: boolean,
    designer: Designer|null
} |
{
    transferType: "full",
    server: ServerFull,
    contentStore: ContentStoreFull,
    subscriptions: SubscriptionManager,
    designerSubscriptions: DesignerSubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
    appReady: boolean,
    launcherReady: boolean,
    designer: Designer|null
}

/** Contentstore instance */
const contentStore = new ContentStore();

/** SubscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore);

/** DesignerSubscriptionManager instance */
const designerSubscriptions = new DesignerSubscriptionManager(contentStore);

/** AppSettings instance */
const appSettings = new AppSettings(contentStore, subscriptions);

/** Server instance */
const server = new Server(contentStore, subscriptions, appSettings);

/** API instance */
const api = new API(server, contentStore, appSettings, subscriptions);

contentStore.setSubscriptionManager(subscriptions);
contentStore.setServer(server);
contentStore.setAppSettings(appSettings)
server.setAPI(api);
subscriptions.setAppSettings(appSettings);
subscriptions.setServer(server);

/** Initial value for state */
const initValue: AppContextType = {
    transferType: "partial",
    contentStore: contentStore,
    server: server,
    api: api,
    appSettings: appSettings,
    subscriptions: subscriptions,
    designerSubscriptions: designerSubscriptions,
    ctrlPressed: false,
    appReady: false,
    designer: null
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/** This component provides the appContext to its children */
const AppProvider: FC<ICustomContent> = (props) => {
    /** History of react-router-dom */
    const history = useHistory();

    /** Sets the initial state */
    const initState = (): AppContextType => {
        initValue.contentStore.history = history;
        initValue.api.history = history;
        initValue.server.history = history;
        if (props.designer) {
            initValue.designer = props.designer
        }
        
        return {
            ...initValue,
        }
    }

    /** Reference for the websocket */
    const ws = useRef<WebSocket|null>(null);

    /** Flag, if the websocket needs to be reconnected */
    const isReconnect = useRef<boolean>(false);

    /** Flag if the websocket is connected */
    const wsIsConnected = useRef<boolean>(false);

    /** Reference for the relaunchArguments sent by the server */
    const relaunchArguments = useRef<any>(null);

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState());

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    /** State if session is expired */
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);

    /** Reference for the interval at which alive requests are being sent */
    const aliveInterval = useRef<any>(undefined);

    /**
     * Subscribes to session-expired, app-ready and restart
     * @returns unsubscribes from session, app-ready and restart
     */
     useEffect(() => {
        contextState.subscriptions.subscribeToAppReady((ready:boolean) => setContextState(prevState => ({ ...prevState, appReady: ready })));
        contextState.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));
        contextState.subscriptions.subscribeToSessionExpired((sessionExpired:boolean) => setSessionExpired(sessionExpired));

        return () => {
            contextState.subscriptions.unsubscribeFromAppReady();
            contextState.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
            contextState.subscriptions.unsubscribeFromSessionExpired((sessionExpired:boolean) => setSessionExpired(sessionExpired));
        }
    },[contextState.subscriptions]);

    /** When the session expires, clear the alive interval so no more alive intervals are being sent */
    useEffect(() => {
        if (sessionExpired) {
            clearInterval(aliveInterval.current);
        }
    }, [sessionExpired])

    // Creates the startup-request and sends it to the server, inits the websocket
    useEffect(() => {
        const startUpRequest = createStartupRequest();
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = localStorage.getItem("authKey");
        let themeToSet = "";
        let schemeToSet = "";
        let baseUrlToSet = "";
        let designerUrlToSet = "";
        let timeoutToSet = 10000;
        let searchPathToSet = "/services/mobile";
        let aliveIntervalToSet:number|undefined = undefined;
        let wsPingIntervalToSet:number|undefined = undefined;
        let autoRestartSession:boolean = false;

        let logoBigAlreadySet = false;
        let logoSmallAlreadySet = false;
        let logoLoginAlreadySet = false;

        /** Initialises the websocket and handles the messages the server sends and sets the ping interval. also handles reconnect */
        const initWS = (baseURL:string) => {
            let pingInterval = new Timer(() => ws.current?.send("PING"), contextState.server.wsPingInterval >= 10000 ? contextState.server.wsPingInterval : 10000);
            pingInterval.stop();

            let index = 0;
            let reconnectActive = false;
            let reconnectInterval = new Timer(() => {
                if (!sessionExpired) {
                    connectWs();
                    index++
                    if (index <= 5) {
                        contextState.subscriptions.emitErrorBarProperties(false, false, true, 8, translation.get("The server is not reachable") , translation.get("The server is not reachable, trying again in 5 seconds. Retry: ") + index);
                        if (index === 1) {
                            contextState.subscriptions.emitErrorBarVisible(true);
                        }
                    }
                    else {
                        contextState.subscriptions.emitErrorBarProperties(false, false, false, 8, translation.get("The server is not reachable"), translation.get("The server is not reachable"), () => {
                            return new Promise<void>((resolve) => {
                                index = 0;
                                connectWs().then(() => resolve());
                                if (getClientId() !== "ClientIdNotFound") {
                                    contextState.server.sendRequest(createAliveRequest(), REQUEST_KEYWORDS.ALIVE);
                                }
                            })

                        });
                    }
                }
            }, 5000);
            reconnectInterval.stop();

            /** Connects the websocket to the server */
            const connectWs = () => {
                return new Promise<void>((resolve) => {
                    console.log('connecting WebSocket')
                    const urlSubstr = baseURL.substring(baseURL.indexOf("//") + 2, baseURL.indexOf(searchPathToSet));
    
                    // create the websocket and connect to this url, wss secure, ws unsecure + searchPath + clientId + reconnect if needed
                    ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + encodeURIComponent(getClientId())
                    + (isReconnect.current ? "&reconnect" : ""));
                    ws.current.onopen = () => {
                        ws.current?.send("PING");
                        resolve();
                    };
                    ws.current.onclose = (event) => {
                        // Stop sending ping and alive on ws close
                        pingInterval.stop();
                        clearInterval(aliveInterval.current);
                        if (event.code === 1000) {
                            // no reconnect
                            wsIsConnected.current = false;
                            console.log("WebSocket has been closed.");
                            resolve();
                        }
                        else if (event.code !== 1008) {
                            // reconnecting
                            isReconnect.current = true;
                            wsIsConnected.current = false;
                            console.log("WebSocket has been closed, reconnecting in 5 seconds.");
                            if (!reconnectActive) {
                                reconnectInterval.start();
                                reconnectActive = true;
                            }
                            
                            // stop after 5 retries
                            if (index > 5 && reconnectActive) {
                                reconnectInterval.stop();
                                reconnectActive = false;
                            }
                        }
                        else {
                            if (event.code === 1008) {
                                reconnectInterval.stop();
                                reconnectActive = false;
                                contextState.subscriptions.emitErrorBarProperties(true, false, false, 11, translation.get("Session expired!"));
                            }
                            else {
                                if (index > 5 && reconnectActive) {
                                    reconnectInterval.stop();
                                    reconnectActive = false;
                                }
                            }
                            console.log("WebSocket has been closed.");
                            resolve();
                        }
                    };
    
                    ws.current.onerror = () => console.error("WebSocket error");
    
                    ws.current.onmessage = (e) => {
                        if (e.data instanceof Blob) {
                            const reader = new FileReader()
        
                            reader.onloadend = () => { 
                                let jscmd = JSON.parse(String(reader.result)); 
                    
                                // Reset the application
                                if (jscmd.command === "dyn:relaunch") {
                                    contextState.contentStore.reset();
                                    relaunchArguments.current = jscmd.arguments;
                                    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
                                        ws.current.close(1000);
                                        ws.current = null;
                                    }
                                    contextState.server.isExiting = true;
                                    contextState.server.timeoutRequest(fetch(contextState.server.BASE_URL + contextState.server.endpointMap.get(REQUEST_KEYWORDS.EXIT), contextState.server.buildReqOpts(createAliveRequest())), contextState.server.timeoutMs);
                                    contextState.appSettings.setAppReadyParamFalse();
                                    contextState.subscriptions.emitAppReady(false);
                                    contextState.subscriptions.emitRestart();
                                    contextState.contentStore.reset();
                                    sessionStorage.clear();
                                }
                                else if (jscmd.command === "api/reopenScreen") {
                                    // reopen the current screen
                                    if (!isDesignerVisible(contextState.designer)) {
                                        const openReq = createOpenScreenRequest();
                                        openReq.className = jscmd.arguments.className;
                                        showTopBar(contextState.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), contextState.server.topbar);
                                    }
                                }
                                else if (jscmd.command === "dyn:reloadCss") {
                                    //reload the css
                                    contextState.subscriptions.emitAppCssVersion(jscmd.arguments.version);
                                }
                                else if (jscmd.command === "api/menu") {
                                    // reload the menu
                                    const menuReq = createBaseRequest();
                                    showTopBar(contextState.server.sendRequest(menuReq, REQUEST_KEYWORDS.MENU), contextState.server.topbar);
                                }
                            }
                            reader.readAsText(e.data);
                        }
                        else {
                            if (e.data === "api/changes") {
                                // send a changes request
                                contextState.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
                            }
                            else if (e.data === "OK" && !wsIsConnected.current) {
                                if (isReconnect.current) {
                                    // Reconnect success
                                    isReconnect.current = false;
                                    console.log("WebSocket reconnected.");
                                    if (reconnectActive) {
                                        reconnectInterval.stop();
                                        reconnectActive = false;
                                    }
                                    
                                    
                                    index = 0;
                                    contextState.subscriptions.emitErrorBarVisible(false);
                                    wsIsConnected.current = true;
                                }
                                else {
                                    // connection success
                                    console.log("WebSocket opened.");
                                    wsIsConnected.current = true;
                                }
            
                                if (contextState.server.wsPingInterval > 0) {
                                    // start pinging
                                    pingInterval.start();
                                }
                            }
                        }
                    }
                })
            }
            connectWs()
        }

        /** Sends the startup-request to the server and initialises the alive interval */
        const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, restartArgs?:any) => {
            if (restartArgs) {
                (req as StartupRequest).arguments = restartArgs;
                relaunchArguments.current = null;
            }
            // Send a ui refresh if the session should be preserved
            contextState.server.sendRequest(req, (preserve && !restartArgs) ? REQUEST_KEYWORDS.UI_REFRESH : REQUEST_KEYWORDS.STARTUP)
            .then(result => {
                if (result !== null) {
                    // sets startup property from the app ready properties to true
                    contextState.appSettings.setAppReadyParam("startup");
                    if (!preserve) {
                        sessionStorage.removeItem("preserveOnReload");
                        sessionStorage.removeItem("applicationName");
                        sessionStorage.removeItem("applicationColorScheme");
                        sessionStorage.removeItem("applicationTheme");

                        (result as Array<any>).forEach((response) => {
                            if (response.preserveOnReload) {
                                sessionStorage.setItem("preserveOnReload", response.preserveOnReload);
                            }
                            if (response.applicationName) {
                                sessionStorage.setItem("applicationName", response.applicationName);
                            }
                            if (response.applicationColorScheme) {
                                sessionStorage.setItem("applicationColorScheme", response.applicationColorScheme);
                            }
                            if (response.applicationTheme) {
                                sessionStorage.setItem("applicationTheme", response.applicationTheme);
                            }
                        });
                    }
    
                    // Creates an interval to send alive requests to the server
                    if (contextState.server.aliveInterval >= 0) {
                        aliveInterval.current = setInterval(() => {
                            if ((Math.ceil(Date.now() / 1000) - Math.ceil(contextState.server.lastRequestTimeStamp / 1000)) >= Math.floor(contextState.server.aliveInterval / 1000))  {
                                if (getClientId() !== "ClientIdNotFound") {
                                    contextState.server.sendRequest(createAliveRequest(), REQUEST_KEYWORDS.ALIVE);
                                }
                            }
                        }, contextState.server.aliveInterval)
                    }
    
                    // initialises the WebSocket
                    if (([RESPONSE_NAMES.SESSION_EXPIRED, RESPONSE_NAMES.ERROR] as string[]).indexOf((result[0] as BaseResponse).name) === -1) {
                        initWS(contextState.server.BASE_URL);
                    }
                    
                    // Calls function of onStartup if declared by a lib user
                    if (props.onStartup) {
                        props.onStartup();
                    }
                }
            })
            .catch(() => {});
        }

        // Fetches the app file which contains intervals
        const fetchApp = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/config/app.json').then((r) => r.json())
                .then((data) => {
                    // Set various parameters which could be entered in the app.json
                    if (data.appName) {
                        startUpRequest.applicationName = data.appName
                    }

                    if (data.baseUrl) {
                        baseUrlToSet = data.baseUrl;
                    }

                    if (data.requestTimeout) {
                        timeoutToSet = parseInt(data.requestTimeout);
                    }

                    if (data.searchPath) {
                        searchPathToSet = data.searchPath;
                    }

                    if (data.aliveInterval) {
                        aliveIntervalToSet = parseInt(data.aliveInterval);
                    }

                    if (data.wsPingInterval) {
                        wsPingIntervalToSet = parseInt(data.wsPingInterval);
                    }

                    if (data.transferType) {
                        if (data.transferType === "full") {
                            contextState.transferType = "full"
                            contextState.appSettings.transferType = "full"
                        }
                        else {
                            contextState.transferType = "partial"
                            contextState.appSettings.transferType = "partial"
                        }
                    }

                    if (data.autoRestartOnSessionExpired === true) {
                        autoRestartSession = true;
                    }

                    // if this is set to true, the css-designer will be enabled
                    if (data.useDesigner === true) {
                        contextState.appSettings.showDesigner = true;
                    }

                    // if this is set to true, the visionx-designer will be enabled
                    if (data.useUIDesigner === true && props.enableDesigner) {
                        contextState.appSettings.showUIDesigner = props.enableDesigner
                        
                    }

                    if (data.payloadCompress) {
                        contextState.server.compress = data.payloadCompress === true;
                    }

                    // url where the css files are being uploaded
                    if (data.designerUploadUrl) {
                        designerUrlToSet = data.designerUploadUrl;
                    }
                    resolve({});
                })
                .catch(() => reject("app.json not found"))
            });
        }

        // Fetches the config.json file which contains various application settings
        const fetchConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('config.json')
                .then((r) => r.json())
                .then((data) => {
                    if (data.appName) {
                        startUpRequest.applicationName = data.appName;
                    }

                    if (data.baseUrl) {
                        baseUrlToSet = data.baseUrl;
                    }

                    if (data.searchPath) {
                        searchPathToSet = data.searchPath;
                    }

                    if (data.userName || data.username) {
                        startUpRequest.userName = data.userName || data.username;
                    }

                    if (data.password) {
                        startUpRequest.password = data.password;
                    }
        
                    if (data.logoBig) {
                        contextState.appSettings.LOGO_BIG = data.logoBig;
                        logoBigAlreadySet = true;
                    }
        
                    if (data.logoSmall) {
                        contextState.appSettings.LOGO_SMALL = data.logoSmall;
                        logoSmallAlreadySet = true;
                    } 
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_SMALL = data.logoBig;
                    }
                        
                    if (data.logoLogin) {
                        contextState.appSettings.LOGO_LOGIN = data.logoLogin;
                        logoLoginAlreadySet = true;
                    }
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_LOGIN = data.logoBig;
                    }
    
                    if (data.language) {
                        startUpRequest.langCode = data.language;
                        contextState.appSettings.language = data.language;
                        contextState.appSettings.locale = data.language;
                    }
    
                    if (data.timeZone) {
                        contextState.appSettings.timeZone = data.timeZone;
                    }
    
                    if (data.colorScheme) {
                        schemeToSet = data.colorScheme;
                    }
    
                    if (data.theme) {
                        themeToSet = data.theme;
                    }

                    if (data.debug && data.debug === true) {
                        contextState.appSettings.showDebug = true;
                    }

                    if (data.useDesigner === true) {
                        contextState.appSettings.showDesigner = true;
                    }

                    if (data.useUIDesigner === true && props.enableDesigner) {
                        contextState.appSettings.showUIDesigner = props.enableDesigner;
                    }

                    if (data.transferType) {
                        if (data.transferType === "full") {
                            contextState.transferType = "full"
                            contextState.appSettings.transferType = "full"
                        }
                        else {
                            contextState.transferType = "partial"
                            contextState.appSettings.transferType = "partial"
                        }
                    }

                    resolve({})
                })
                .catch(() => reject("config.json not found"))
            });
        }
        //checks either url or embed options
        const checkExtraOptions = (options: URLSearchParams|{ [key:string]:any }) => {
            let convertedOptions:Map<string, any>;
            let appName;
            let baseUrl;

            // Convert either out of URL Parameters or from passed properties
            if (options instanceof URLSearchParams) {
                convertedOptions = new Map(options);
            }
            else {
                convertedOptions = new Map(Object.entries(options));
            }

            if (convertedOptions.has("appName")) {
                appName = convertedOptions.get("appName") as string;
                if (appName.charAt(appName.length - 1) === "/") {
                    appName = appName.substring(0, appName.length - 1);
                }
                startUpRequest.applicationName = appName;
                convertedOptions.delete("appName");
            }

            if (convertedOptions.has("searchPath")) {
                searchPathToSet = convertedOptions.get("searchPath") as string;
            }
            
            if (convertedOptions.has("baseUrl")) {
                baseUrl = convertedOptions.get("baseUrl") as string;
                if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                }
                baseUrlToSet = baseUrl;
                convertedOptions.delete("baseUrl");
            }

            if (convertedOptions.has("username")) {
                startUpRequest.userName = convertedOptions.get("username");
                convertedOptions.delete("username");
            }

            if (convertedOptions.has("userName")) {
                startUpRequest.userName = convertedOptions.get("userName");
                convertedOptions.delete("userName");
            }

            if (convertedOptions.has("password")) {
                startUpRequest.password = convertedOptions.get("password");
                convertedOptions.delete("password");
            }

            if (convertedOptions.has("layout") && ["standard", "corporation", "modern"].indexOf(convertedOptions.get("layout") as string) !== -1) {
                contextState.appSettings.setApplicationLayoutByURL(convertedOptions.get("layout") as "standard" | "corporation" | "modern");
                startUpRequest.layout = convertedOptions.get("layout");
                convertedOptions.delete("layout");
            }

            if (convertedOptions.has("language")) {
                contextState.appSettings.language = convertedOptions.get("language");
                contextState.appSettings.locale = convertedOptions.get("language");
                startUpRequest.langCode = convertedOptions.get("language");
                convertedOptions.delete("language");
            }

            if (convertedOptions.has("timeZone")) {
                contextState.appSettings.timeZone = convertedOptions.get("timeZone");
                startUpRequest.timeZone = convertedOptions.get("timeZone");
                convertedOptions.delete("timeZone");
            }

            if (convertedOptions.has("deviceMode")) {
                contextState.appSettings.deviceMode = convertedOptions.get("deviceMode");
                startUpRequest.deviceMode = convertedOptions.get("deviceMode");
                convertedOptions.delete("deviceMode");
            }

            if (convertedOptions.has("colorScheme")) {
                schemeToSet = convertedOptions.get("colorScheme");
                convertedOptions.delete("colorScheme");
            }

            if (props.colorScheme) {
                schemeToSet = props.colorScheme;
            }

            // load the set colorscheme into dom
            if (schemeToSet) {
                contextState.appSettings.setApplicationColorSchemeByURL(schemeToSet);
                addCSSDynamically('color-schemes/' + schemeToSet + '.css', "schemeCSS", () => contextState.appSettings.setAppReadyParam("schemeCSS"));
            }

            if (convertedOptions.has("theme")) {
                themeToSet = convertedOptions.get("theme");
                convertedOptions.delete("theme");
            }

            if (props.theme) {
                themeToSet = props.theme;
            }

            // load the set theme into dom
            if (themeToSet) {
                contextState.appSettings.setApplicationThemeByURL(themeToSet);

                if (!logoBigAlreadySet) {
                    contextState.appSettings.LOGO_BIG = "/assets/" + themeToSet + "/logo_big.png";
                }

                if (!logoSmallAlreadySet) {
                    contextState.appSettings.LOGO_SMALL = "/assets/" + themeToSet + "/logo_small.png";
                }

                if (!logoLoginAlreadySet) {
                    contextState.appSettings.LOGO_LOGIN = "/assets/" + themeToSet + "logo_login.png";
                }

                addCSSDynamically('themes/' + themeToSet + '.css', "themeCSS", () => contextState.appSettings.setAppReadyParam("themeCSS"));
                contextState.subscriptions.emitThemeChanged(themeToSet);
            }

            if (convertedOptions.has("transferType")) {
                if (convertedOptions.get("transferType") === "full") {
                    contextState.transferType = convertedOptions.get("transferType");
                    contextState.appSettings.transferType = "full";
                }
                else {
                    contextState.transferType = "partial";
                    contextState.appSettings.transferType = "partial";
                }

            }

            if (convertedOptions.has("requestTimeout")) {
                const parsedValue = parseInt(convertedOptions.get("requestTimeout"));
                if (!isNaN(parsedValue)) {
                    timeoutToSet = parsedValue;
                }

                convertedOptions.delete("requestTimeout");
            }

            if (convertedOptions.has("aliveInterval")) {
                const parsedValue = parseInt(convertedOptions.get("aliveInterval"));
                if (!isNaN(parsedValue)) {
                    aliveIntervalToSet = parsedValue;
                }

                convertedOptions.delete("aliveInterval");
            }

            if (convertedOptions.has("wsPingInterval")) {
                const parsedValue = parseInt(convertedOptions.get("wsPingInterval"));
                if (!isNaN(parsedValue)) {
                    wsPingIntervalToSet = parsedValue;
                }

                convertedOptions.delete("wsPingInterval");
            }

            if (convertedOptions.has("debug") && convertedOptions.get("debug") === "true") {
                contextState.appSettings.showDebug = true;
                convertedOptions.delete("debug");
            }

            convertedOptions.forEach((v, k) => {
                startUpRequest["custom_" + k] = v;
            });
        }

        // Initialises contentstore and server after config fetches. based on transfertype
        const afterConfigFetch = () => {
            checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams);
            if (contextState.transferType === "full") {
                // Creates new ContentStore and Server instances for full transferType. Other instances need to be set again to have current ones
                contextState.contentStore = new ContentStoreFull(history);
                contextState.contentStore.setSubscriptionManager(contextState.subscriptions);
                contextState.contentStore.setAppSettings(contextState.appSettings);
                contextState.subscriptions.setContentStore(contextState.contentStore);
                contextState.api.setContentStore(contextState.contentStore);
                contextState.appSettings.setContentStore(contextState.contentStore);
                contextState.designerSubscriptions.setContentStore(contextState.contentStore);

                contextState.server = new ServerFull(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
                contextState.contentStore.setServer(contextState.server);
                contextState.api.setServer(contextState.server);
                contextState.subscriptions.setServer(contextState.server);
                contextState.launcherReady = false;

                if (wsPingIntervalToSet) {
                    contextState.server.wsPingInterval = wsPingIntervalToSet;
                }
            }
            else {
                contextState.server = new Server(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
                contextState.contentStore.setServer(contextState.server);
                contextState.contentStore.designer = contextState.designer

                if (aliveIntervalToSet !== undefined) {
                    contextState.server.aliveInterval = aliveIntervalToSet
                }

                if (wsPingIntervalToSet !== undefined) {
                    contextState.server.wsPingInterval = wsPingIntervalToSet
                }

                contextState.server.autoRestartOnSessionExpired = autoRestartSession;
                
                // open the screen which is being entered into the url, eg. when reloading
                if (history.location.pathname.includes("/screens/")) {
                    contextState.server.linkOpen = history.location.pathname.replaceAll("/", "").substring(indexOfEnd(history.location.pathname, "screens") - 1);
                }
                if (localStorage.getItem("restartScreen")) {
                    contextState.server.linkOpen = localStorage.getItem("restartScreen") as string;
                    localStorage.removeItem("restartScreen");

                }
                contextState.api.setServer(contextState.server);
                contextState.subscriptions.setServer(contextState.server);

                if (props.onMenu) {
                    contextState.server.setOnMenuFunction(props.onMenu);
                }
        
                if (props.onOpenScreen) {
                    contextState.server.setOnOpenScreenFunction(props.onOpenScreen);
                }
        
                if (props.onLogin) {
                    contextState.server.setOnLoginFunction(props.onLogin);
                }

                if (wsPingIntervalToSet) {
                    contextState.server.wsPingInterval = wsPingIntervalToSet;
                }
            }
            contextState.server.BASE_URL = baseUrlToSet;
            contextState.server.timeoutMs = timeoutToSet;
            contextState.server.designerUrl = designerUrlToSet;

            startUpRequest.requestUri = initialURL;
            startUpRequest.baseUrl = baseUrlToSet;

            if(authKey) {
                startUpRequest.authKey = authKey;
            }
            startUpRequest.deviceMode = contextState.appSettings.deviceMode;
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            startUpRequest.serverVersion = "4.0.0";
            startUpRequest.langCode = contextState.appSettings.language;
            startUpRequest.timeZoneCode = contextState.appSettings.timeZone;
            startUpRequest.readAheadLimit = 100;
            startUpRequest.option_bigdecimal_as_string = true;
            contextState.appSettings.option_bigdecimal_as_string = true;
            if (contextState.contentStore.customStartUpProperties.length) {
                contextState.contentStore.customStartUpProperties.map(customProp => startUpRequest["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
            }
            
            if (sessionStorage.getItem("applicationName") && !relaunchArguments.current) {
                let preserveOnReload = false;
                if (sessionStorage.getItem("preserveOnReload")) {
                    preserveOnReload = true;
                }
                if (sessionStorage.getItem("applicationName")) {
                    contextState.server.RESOURCE_URL = contextState.server.BASE_URL + "/resource/" + sessionStorage.getItem("applicationName");
                }
                // Load css files into dom
                if (sessionStorage.getItem("applicationColorScheme") && !schemeToSet) {
                    addCSSDynamically('color-schemes/' + sessionStorage.getItem("applicationColorScheme") + '.css', "schemeCSS", () => {});
                }
                if (sessionStorage.getItem("applicationTheme") && !themeToSet) {
                    addCSSDynamically('themes/' + sessionStorage.getItem("applicationTheme") + '.css', "themeCSS", () => {});
                }
                // if not preserve send exit for old application
                if (!preserveOnReload) {
                    contextState.server.timeoutRequest(fetch(contextState.server.BASE_URL + contextState.server.endpointMap.get(REQUEST_KEYWORDS.EXIT), contextState.server.buildReqOpts(createAliveRequest())), contextState.server.timeoutMs);
                    contextState.contentStore.navigationNames.clear();
                    contextState.contentStore.setActiveScreen();
                }
                sendStartup(preserveOnReload ? createUIRefreshRequest() : startUpRequest, preserveOnReload);
            } 
            else {
                sendStartup(startUpRequest, false, relaunchArguments.current);
            }
        }

        if (process.env.NODE_ENV === "development") {
            Promise.all([fetchConfig(), fetchApp()])
            .then(() => afterConfigFetch())
            .catch(() => afterConfigFetch())
        }
        else {
            // Build the correct baseURL in production if the url has a specific structure
            if (process.env.NODE_ENV === "production") {
                // TODO for future optimatization, not the / should be counted, the parts should be counted
                // VisionX starts with /app/ui/<projectname>/
                // Normaly it's /<contextname>/ui, /<contextname>/ui/, /ui or /ui/
                // in case the application is in an root container, and the application is in an subfolder (/en/ui), 
                // the detection will fail anyway,
                // .replace(/^\/+|\/(?:index\.(html?|js(p|f)))?$/g, "") to remove leading and trailing / and /index.htm, /index.html, /index.jsp, /index.jsf
                const splitURLPath = window.location.pathname.split("/");

                if (splitURLPath.length === 4) {
                    baseUrlToSet = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + searchPathToSet;
                }
                else {
                    for (let i = 0; i <= 3; i++) {
                        splitURLPath.pop();
                    }
                    if (splitURLPath.length > 1) {

                        baseUrlToSet = window.location.protocol + "//" + window.location.host + splitURLPath.join("/") + searchPathToSet;
                    }
                    else {
                        baseUrlToSet = window.location.protocol + "//" + window.location.host + searchPathToSet;
                    }
                    
                }
            }
            fetchApp().then(() => afterConfigFetch()).catch(() => afterConfigFetch())
        }
    }, [restart]);

    // When the designer gets toggled on, keep instances up to date
    useEffect(() => {
        if (contextState.designer) {
            contextState.designer.contentStore = contextState.contentStore;
            contextState.designer.server = contextState.server;
            contextState.contentStore.designer = contextState.designer;
        }
    }, [contextState.designer, contextState.contentStore, contextState.server, restart]);

    // Global eventlistener to listen to control presses
    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = false : undefined);

    return (
        <appContext.Provider value={contextState}>
            {props.children}
        </appContext.Provider>
    )
}
export default AppProvider

