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

export function isV2ContentStore(contentStore: ContentStore | ContentStoreFull): contentStore is ContentStore {
    return (contentStore as ContentStore).menuItems !== undefined;
}

/** Type for AppContext */
export type AppContextType = {
    transferType: "partial",
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
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
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
    appReady: boolean,
    launcherReady: boolean
}

/** Contentstore instance */
const contentStore = new ContentStore();
/** SubscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore)
/** AppSettings instance */
const appSettings = new AppSettings(contentStore, subscriptions);
/** Server instance */
const server = new Server(contentStore, subscriptions, appSettings);
/** API instance */
const api = new API(server, contentStore, appSettings, subscriptions);

contentStore.setSubscriptionManager(subscriptions);
contentStore.setServer(server);

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

    const ws = useRef<WebSocket|null>(null);

    const isReconnect = useRef<boolean>(false);

    const wsIsConnected = useRef<boolean>(false);

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

    /** Default values for translation */
    useEffect(() => {
        contextState.contentStore.translation
        .set("Username", "Username")
        .set("Password", "Password")
        .set("Login", "Login")
        .set("Logout", "Logout")
        .set("Settings", "Settings")
        .set("Change password", "Change password")
        .set("Please enter and confirm the new password.", "Please enter and confirm the new password.")
        .set("New Password", "New Password")
        .set("Confirm Password", "Confirm Password")
        .set("The new Password is empty", "The new Password is empty")
        .set("The passwords are different!", "The passwords are different!")
        .set("The old and new password are the same", "The old and new password are the same")
        .set("Change password", "Change password")
        .set("Reset password", "Reset password")
        .set("Lost password", "Lost password")
        .set("Remember me?", "Remember me?")
        .set("Email", "Email")
        .set("Request", "Request")
        .set("Please enter your e-mail address.", "Please enter your e-mail address.")
        .set("The email is required", "The email is required")
        .set("One-time password", "One-time password")
        .set("Please enter your one-time password and set a new password", "Please enter your one-time password and set a new password")
        .set("Please enter your e-mail address.", "Please enter your e-mail address.")
        .set("Save", "Save")
        .set("Reload", "Reload")
        .set("Rollback", "Rollback")
        .set("Information", "Information")
        .set("Error", "Error")
        .set("Warning", "Warning")
        .set("Question", "Question")
        .set("OK", "OK")
        .set("Cancel", "Cancel")
        .set("Yes", "Yes")
        .set("No", "No")
        .set("Change", "Change")
        .set("Session expired!", "Session expired!")
        .set("Take note of any unsaved data, and <u>click here</u> or press ESC to continue.", "Take note of any unsaved data, and <u>click here</u> or press ESC to continue.")
        .set("The authentication code is required", "The authentication code is required")
        .set("Code", "Code")
        .set("Verification", "Verification")
        .set("Please enter your confirmation code.", "Please enter your confirmation code.")
        .set("Waiting for verification.", "Waiting for verification.")
        .set("Matching code", "Matching code")
        .set("Confirm", "Confirm")
        .set("Details", "Details")
        .set("Cause(s) of failure", "Cause(s) of failure")
        .set("Restart", "Restart");
    },[contextState.contentStore]);

    useEffect(() => {
        const startUpRequest = createStartupRequest();
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = localStorage.getItem("authKey");
        let themeToSet = "";
        let schemeToSet = "";
        let designToSet = "";
        let baseUrlToSet = "";
        let timeoutToSet = 10000;
        let aliveIntervalToSet:number|undefined = undefined;
        let wsPingIntervalToSet:number|undefined = undefined;

        const initWS = (baseURL:string) => {
            const connectWs = () => {
                const urlSubstr = baseURL.substring(baseURL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));

                let pingInterval = new Timer(() => ws.current?.send("PING"), contextState.server.wsPingInterval >= 10000 ? contextState.server.wsPingInterval : 10000);

                ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId() 
                + (isReconnect.current ? "&reconnect" : ""));
                ws.current.onopen = () => {
                    if (isReconnect.current) {
                        isReconnect.current = false;
                        console.log("WebSocket reconnected.");
                        wsIsConnected.current = true;
                    }
                    else {
                        console.log("WebSocket opened.");
                        wsIsConnected.current = true;
                    }

                    if (contextState.server.wsPingInterval >= 0) {
                        pingInterval.start();
                    }
                };
                ws.current.onclose = (event) => {
                    pingInterval.stop();
                    if (event.code !== 1006) {
                        isReconnect.current = true;
                        wsIsConnected.current = false;
                        console.log("WebSocket has been closed, reconnecting in 1 second.");
                        setTimeout(() => connectWs(), 1000);
                    }
                    else {
                        console.log("WebSocket has been closed.")
                    }
                };

                ws.current.onerror = () => console.error("WebSocket error");

                ws.current.onmessage = (e) => {
                    if (e.data instanceof Blob) {
                        const reader = new FileReader()
    
                        reader.onloadend = () => { 
                            let jscmd = JSON.parse(String(reader.result)); 
                
                            if (jscmd.command === "relaunch") {
                                contextState.contentStore.reset();
                                relaunchArguments.current = jscmd.arguments;
                                setRestart(prevState => !prevState);
                            }
                            else if (jscmd.command === "api/reopenScreen") {
                                const openReq = createOpenScreenRequest();
                                openReq.className = jscmd.arguments.className;
                                showTopBar(contextState.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), topbar);
                            }
                            else if (jscmd.command === "reloadCss") {
                                contextState.subscriptions.emitCssVersion(jscmd.arguments.version);
                            }
                        }
                        reader.readAsText(e.data);
                    }
                    else {
                        if (e.data === "api/changes") {
                            contextState.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
                        }
                    }
                }
            }

            connectWs()
        }

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

                setInterval(() => {
                    if ((Math.floor(Date.now() / 1000) - Math.floor(contextState.server.lastRequestTimeStamp / 1000)) >= Math.floor(contextState.server.aliveInterval / 1000))  {
                        contextState.server.sendRequest(createAliveRequest(), REQUEST_KEYWORDS.ALIVE);
                    }
                }, contextState.server.aliveInterval)

                initWS(contextState.server.BASE_URL);
            })
            .catch(() => {});
        }

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
                    resolve({});
                })
                .catch(() => reject("app.json not found"))
            });
        }

        const fetchAppConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/config/app_config.json').then((r) => r.json())
                .then((data) => {
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
                    resolve({});
                })
                .catch(() => reject("app_version.json not found"));
            });
        }

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
    
                    if (data.langCode) {
                        contextState.appSettings.language = data.langCode;
                        contextState.appSettings.locale = data.langCode;
                    }
    
                    if (data.timezone) {
                        contextState.appSettings.timezone = data.timezone;
                    }
    
                    if (data.colorScheme) {
                        schemeToSet = data.colorScheme;
                    }
    
                    if (data.theme) {
                        themeToSet = data.theme;
                    }
    
                    if (data.design) {
                        designToSet = data.design;
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

                if (splitURLPath.length - 2 >= 3 || !splitURLPath[1]) {
                    baseUrlToSet = window.location.protocol + "//" + window.location.host + "/services/mobile"
                }
                else if (splitURLPath[1]) {
                    baseUrlToSet = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
                }
            }

            if (convertedOptions.has("username")) {
                startUpRequest.username = convertedOptions.get("username");
                convertedOptions.delete("username");
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

            if (convertedOptions.has("langCode")) {
                contextState.appSettings.language = convertedOptions.get("langCode");
                contextState.appSettings.locale = convertedOptions.get("langCode");
                startUpRequest.langCode = convertedOptions.get("langCode");
                convertedOptions.delete("langCode");
            }

            if (convertedOptions.has("timezone")) {
                contextState.appSettings.timezone = convertedOptions.get("timezone");
                startUpRequest.timezone = convertedOptions.get("timezone");
                convertedOptions.delete("timezone");
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
                addCSSDynamically('color-schemes/' + schemeToSet + '-scheme.css', "schemeCSS", () => contextState.appSettings.setAppReadyParam("schemeCSS"));
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

            if (convertedOptions.has("design")) {
                designToSet = convertedOptions.get("design");
                convertedOptions.delete("design");
            }

            if (props.design) {
                designToSet = props.design;
            }

            if (designToSet) {
                contextState.appSettings.setApplicationDesign(designToSet);
                addCSSDynamically('design/' + designToSet + ".css", "designCSS", () => contextState.appSettings.setAppReadyParam("designCSS"));
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

            convertedOptions.forEach((v, k) => {
                startUpRequest["custom_" + k] = v;
            });
        }

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
            }
            else {
                contextState.server = new Server(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
                contextState.server.linkOpen = history.location.pathname.replaceAll("/", "").substring(indexOfEnd(history.location.pathname, "home") - 1);
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
            }
            contextState.server.BASE_URL = baseUrlToSet;
            contextState.server.timeoutMs = timeoutToSet

            startUpRequest.requestUri = window.location.href.substring(0, window.location.href.indexOf('#/') + 2);

            if(authKey) {
                startUpRequest.authKey = authKey;
            }
            startUpRequest.deviceMode = contextState.appSettings.deviceMode;
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
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
                        addCSSDynamically('color-schemes/' + response.applicationColorScheme + '-scheme.css', "schemeCSS", () => contextState.appSettings.setAppReadyParam("schemeCSS"), false);
                    }

                    if (response.applicationTheme && !themeToSet) {
                        addCSSDynamically('themes/' + response.applicationTheme + '.css', "themeCSS", () => contextState.appSettings.setAppReadyParam("themeCSS"), false);
                    }

                    if (response.languageResource && response.langCode && response.name === RESPONSE_NAMES.LANGUAGE && contextState.transferType === "partial") {
                        contextState.server.language({ name: "", langCode: response.langCode, languageResource: response.languageResource });
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
            Promise.all([fetchConfig(), fetchApp(), fetchAppConfig()])
            .then(() => afterConfigFetch())
            .catch(() => afterConfigFetch())
        }
        else {
            Promise.all([fetchApp(), fetchAppConfig()])
            .then(() => afterConfigFetch())
            .catch(() => afterConfigFetch())
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

