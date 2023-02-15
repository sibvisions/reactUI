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

import React, { createContext, FC, useContext, useEffect, useRef, useState } from "react";
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
import { ICustomContent } from "../../MiddleMan";
import { showTopBar, TopBarContext } from "../components/topbar/TopBar";
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

/** Checks if the contentstore is for transfermode full */
export function isV2ContentStore(contentStore: ContentStore | ContentStoreFull): contentStore is ContentStore {
    return (contentStore as ContentStore).menuItems !== undefined;
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
    appReady: boolean
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
    launcherReady: boolean
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
    appReady: false
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/**
 * This component provides the appContext to its children
 * @param children - the children
 */
const AppProvider: FC<ICustomContent> = (props) => {
    /** History of react-router-dom */
    const history = useHistory();

    /** Sets the initial state */
    const initState = (): AppContextType => {
        initValue.contentStore.history = history;
        initValue.api.history = history;
        initValue.server.history = history;
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

    /** Reference for the relauncharguments sent by the server */
    const relaunchArguments = useRef<any>(null);

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState());

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        contextState.subscriptions.subscribeToAppReady((ready:boolean) => setContextState(prevState => ({ ...prevState, appReady: ready })));
        contextState.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));

        return () => {
            contextState.subscriptions.unsubscribeFromAppReady();
            contextState.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    },[contextState.subscriptions]);

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
        let aliveIntervalToSet:number|undefined = undefined;
        let wsPingIntervalToSet:number|undefined = undefined;
        let autoRestartSession:boolean = false;
        let aliveInterval:string | number | NodeJS.Timeout | undefined = undefined ;

        /** Initialises the websocket and handles the messages the server sends and sets the ping interval. also handles reconnect */
        const initWS = (baseURL:string) => {
            let pingInterval = new Timer(() => ws.current?.send("PING"), contextState.server.wsPingInterval >= 10000 ? contextState.server.wsPingInterval : 10000);
            pingInterval.stop();

            let index = 0;
            let reconnectActive = false;
            let reconnectInterval = new Timer(() => {
                if (!contextState.server.isSessionExpired) {
                    connectWs();
                    index++
                    if (index <= 5) {
                        contextState.subscriptions.emitErrorBarProperties(false, false, true, "Server not reachable!", "The server is not reachable, trying again in 5 seconds. Retry: " + index);
                        if (index === 1) {
                            contextState.subscriptions.emitErrorBarVisible(true);
                        }
                    }
                    else {
                        contextState.subscriptions.emitErrorBarProperties(false, false, true, "Server not reachable!", "The server is not reachable.");
                    }
                }
            }, 5000);
            reconnectInterval.stop();

            const connectWs = () => {
                console.log('connecting WebSocket')
                const urlSubstr = baseURL.substring(baseURL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));

                ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId() 
                + (isReconnect.current ? "&reconnect" : ""));
                ws.current.onopen = () => {
                    ws.current?.send("PING");
                };
                ws.current.onclose = (event) => {
                    pingInterval.stop();
                    clearInterval(aliveInterval);
                    if (event.code === 1000) {
                        wsIsConnected.current = false;
                        console.log("WebSocket has been closed.");
                    }
                    else if (event.code !== 1008) {
                        isReconnect.current = true;
                        wsIsConnected.current = false;
                        console.log("WebSocket has been closed, reconnecting in 5 seconds.");
                        if (!reconnectActive) {
                            reconnectInterval.start();
                            reconnectActive = true;
                        }
                        
                        if (index > 5 && reconnectActive) {
                            reconnectInterval.stop();
                            reconnectActive = false;
                        }
                        
                        // setTimeout(() => connectWs(), 3000);
                    }
                    else {
                        if (index > 5 && reconnectActive) {
                            reconnectInterval.stop();
                            reconnectActive = false;
                        }
                        console.log("WebSocket has been closed.");
                    }
                };

                ws.current.onerror = () => console.error("WebSocket error");

                ws.current.onmessage = (e) => {
                    if (e.data instanceof Blob) {
                        const reader = new FileReader()
    
                        reader.onloadend = () => { 
                            let jscmd = JSON.parse(String(reader.result)); 
                
                            if (jscmd.command === "dyn:relaunch") {
                                contextState.contentStore.reset();
                                relaunchArguments.current = jscmd.arguments;
                                if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
                                    ws.current.close(1000);
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
                                const openReq = createOpenScreenRequest();
                                openReq.className = jscmd.arguments.className;
                                showTopBar(contextState.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), topbar);
                            }
                            else if (jscmd.command === "dyn:reloadCss") {
                                contextState.subscriptions.emitAppCssVersion(jscmd.arguments.version);
                            }
                            else if (jscmd.command === "api/menu") {
                                const menuReq = createBaseRequest();
                                showTopBar(contextState.server.sendRequest(menuReq, REQUEST_KEYWORDS.MENU), topbar);
                            }
                        }
                        reader.readAsText(e.data);
                    }
                    else {
                        if (e.data === "api/changes") {
                            contextState.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
                        }
                        else if (e.data === "OK" && !wsIsConnected.current) {
                            if (isReconnect.current) {
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
                                console.log("WebSocket opened.");
                                wsIsConnected.current = true;
                            }
        
                            if (contextState.server.wsPingInterval > 0) {
                                pingInterval.start();
                            }
                        }
                    }
                }
            }
        
            connectWs()
        }

        /** Sends the startup-request to the server and initialises the alive interval */
        const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, restartArgs?:any) => {
            if (restartArgs) {
                (req as StartupRequest).arguments = restartArgs;
                relaunchArguments.current = null;
            }
            contextState.server.sendRequest(req, (preserve && !restartArgs) ? REQUEST_KEYWORDS.UI_REFRESH : REQUEST_KEYWORDS.STARTUP)
            .then(result => {
                contextState.appSettings.setAppReadyParam("startup");
                if (!preserve) {
                    sessionStorage.setItem("startup", JSON.stringify(result));
                }

                if (contextState.server.aliveInterval >= 0) {
                    aliveInterval = setInterval(() => {
                        if ((Math.ceil(Date.now() / 1000) - Math.ceil(contextState.server.lastRequestTimeStamp / 1000)) >= Math.floor(contextState.server.aliveInterval / 1000))  {
                            if (getClientId() !== "ClientIdNotFound") {
                                contextState.server.sendRequest(createAliveRequest(), REQUEST_KEYWORDS.ALIVE);
                            }
                        }
                    }, contextState.server.aliveInterval)
                }

                initWS(contextState.server.BASE_URL);

                if (props.onStartup) {
                    props.onStartup();
                }
            })
            .catch(() => {});
        }

        // Fetches the app file which contains intervals
        const fetchApp = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/config/app.json').then((r) => r.json())
                .then((data) => {
                    if (data.timeout) {
                        timeoutToSet = parseInt(data.timeout);
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

                    if (data.useDesigner === true) {
                        contextState.appSettings.showDesigner = true;
                    }

                    if (data.useWSDesigner === true) {
                        contextState.appSettings.showWSDesigner = true
                    }

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
                    const dataMap = new Map(Object.entries(data));
                    dataMap.forEach((v, k) => {
                        if (k === "appName") {
                            startUpRequest.applicationName = v;
                        }
                        else if (["theme", "colorScheme"].indexOf(k) === -1) {
                            startUpRequest[k] = v;
                        }
                    });
                    baseUrlToSet = data.baseUrl;
        
                    if (data.logoBig) {
                        contextState.appSettings.LOGO_BIG = data.logoBig;
                    }
        
                    if (data.logoSmall) {
                        contextState.appSettings.LOGO_SMALL = data.logoSmall;
                    } 
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_SMALL = data.logoBig;
                    }
                        
                    if (data.logoLogin) {
                        contextState.appSettings.LOGO_LOGIN = data.logoLogin;
                    }
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_LOGIN = data.logoBig;
                    }
    
                    if (data.language) {
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

                    if (data.useWSDesigner === true) {
                        contextState.appSettings.showWSDesigner = true
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
            
            if (convertedOptions.has("baseUrl")) {
                baseUrl = convertedOptions.get("baseUrl") as string;
                if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                }
                baseUrlToSet = baseUrl;
                convertedOptions.delete("baseUrl");
            }
            else if (process.env.NODE_ENV === "production") {
                const splitURLPath = window.location.pathname.split("/");

                if (splitURLPath.length === 4) {
                    baseUrlToSet = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
                }
                else {
                    baseUrlToSet = window.location.protocol + "//" + window.location.host + "/services/mobile"
                }
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

            if (themeToSet) {
                contextState.appSettings.setApplicationThemeByURL(themeToSet);
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

            if (convertedOptions.has("timeout")) {
                const parsedValue = parseInt(convertedOptions.get("timeout"));
                if (!isNaN(parsedValue)) {
                    timeoutToSet = parsedValue;
                }

                convertedOptions.delete("timeout");
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

            if (convertedOptions.has("debug") && convertedOptions.get("debug") === true) {
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
                contextState.contentStore = new ContentStoreFull(history);
                contextState.contentStore.setSubscriptionManager(contextState.subscriptions);
                contextState.contentStore.setAppSettings(contextState.appSettings);
                contextState.contentStore.setServer(contextState.server);
                contextState.subscriptions.setContentStore(contextState.contentStore);
                contextState.api.setContentStore(contextState.contentStore);
                contextState.appSettings.setContentStore(contextState.contentStore);

                contextState.server = new ServerFull(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
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

                if (aliveIntervalToSet !== undefined) {
                    contextState.server.aliveInterval = aliveIntervalToSet
                }

                if (wsPingIntervalToSet !== undefined) {
                    contextState.server.wsPingInterval = wsPingIntervalToSet
                }

                contextState.server.autoRestartOnSessionExpired = autoRestartSession;
                
                if (history.location.pathname.includes("/home/")) {
                    contextState.server.linkOpen = history.location.pathname.replaceAll("/", "").substring(indexOfEnd(history.location.pathname, "home") - 1);
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

            startUpRequest.requestUri = window.location.href.substring(0, window.location.href.indexOf('#/') + 2);

            if(authKey) {
                startUpRequest.authKey = authKey;
            }
            startUpRequest.deviceMode = contextState.appSettings.deviceMode;
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            startUpRequest.serverVersion = "2.4.0";
            startUpRequest.timeZone = contextState.appSettings.timeZone;
            startUpRequest.locale = contextState.appSettings.locale;
            if (contextState.contentStore.customStartUpProperties.length) {
                contextState.contentStore.customStartUpProperties.map(customProp => startUpRequest["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
            }
            
            const startupRequestCache = sessionStorage.getItem("startup");
            if (startupRequestCache && startupRequestCache !== "null" && !relaunchArguments.current) {
                let preserveOnReload = false;
                (JSON.parse(startupRequestCache) as Array<any>).forEach((response) => {
                    if (response.preserveOnReload) {
                        preserveOnReload = true;
                    }

                    if (response.applicationName) {
                        contextState.server.RESOURCE_URL = contextState.server.BASE_URL + "/resource/" + response.applicationName;
                    }

                    if (response.applicationColorScheme && !schemeToSet) {
                        addCSSDynamically('color-schemes/' + response.applicationColorScheme + '.css', "schemeCSS", () => {});
                    }

                    if (response.applicationTheme && !themeToSet) {
                        addCSSDynamically('themes/' + response.applicationTheme + '.css', "themeCSS", () => {});
                    }
                });
                if (preserveOnReload) {
                    for (let [, value] of contextState.server.subManager.jobQueue.entries()) {
                        value();
                    }
                    contextState.server.subManager.jobQueue.clear();
                }
                else {
                    contextState.server.timeoutRequest(fetch(contextState.server.BASE_URL + contextState.server.endpointMap.get(REQUEST_KEYWORDS.EXIT), contextState.server.buildReqOpts(createAliveRequest())), contextState.server.timeoutMs);
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
            fetchApp().then(() => afterConfigFetch()).catch(() => afterConfigFetch())
        }
    }, [restart])

    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = false : undefined);

    return (
        <appContext.Provider value={contextState}>
            {props.children}
        </appContext.Provider>
    )
}
export default AppProvider

