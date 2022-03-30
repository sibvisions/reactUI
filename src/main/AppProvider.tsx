import React, { createContext, FC, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";
import API from "./API";
import AppSettings, { appVersion } from "./AppSettings";
import { createStartupRequest, createUIRefreshRequest, getClientId } from "../moduleIndex";
import { addCSSDynamically } from "./util";
import { ICustomContent } from "../MiddleMan";
import { REQUEST_KEYWORDS, StartupRequest, UIRefreshRequest } from "./request";
import { BaseResponse, RESPONSE_NAMES } from "./response";

/** Type for AppContext */
export type AppContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
}

console.log('initialising cs, server etc')
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
server.setAPI(api);
/** Initial value for state */
const initValue: AppContextType = {
    contentStore: contentStore,
    server: server,
    api: api,
    appSettings: appSettings,
    subscriptions: subscriptions,
    ctrlPressed: false,
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

    //const ws = useRef<WebSocket|null>(null);

    //const relaunchArguments = useRef<any>(null);

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState());

    // useEffect(() => {
    //     const startUpRequest = createStartupRequest();
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const authKey = localStorage.getItem("authKey");
    //     const newServer = new Server(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
    //     const appSettingsCopy = Object.assign({}, contextState.appSettings);
    //     const subCopy = Object.assign({}, contextState.subscriptions);
    //     const csCopy = Object.assign({}, contextState.contentStore)
    //     let themeToSet = "";
    //     let schemeToSet = "";
    //     let designToSet = "";

    //     const initWS = (baseURL:string) => {
    //         const urlSubstr = baseURL.substring(newServer.BASE_URL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));
            
    //         ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId());
    //         ws.current.onopen = () => console.log("ws opened");
    //         ws.current.onclose = () => console.log("ws closed");
    //         ws.current.onerror = () => console.error("ws error");
    //         ws.current.onmessage = (e) => {
    //             if (e.data instanceof Blob) {
    //                 const reader = new FileReader()

    //                 reader.onloadend = () => { 
    //                     let jscmd = JSON.parse(String(reader.result)); 
            
    //                     if (jscmd.command === "relaunch") {
    //                         csCopy.reset();
    //                         relaunchArguments.current = jscmd.arguments;
    //                         setRestart(prevState => !prevState);
    //                     }
    //                     else if (jscmd.command === "api/reopenScreen") {
    //                         const openReq = createOpenScreenRequest();
    //                         openReq.className = jscmd.arguments.className;
    //                         context.server.lastOpenedScreen = jscmd.arguments.className;
    //                         showTopBar(context.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), topbar);
    //                     }
    //                     else if (jscmd.command === "reloadCss") {
    //                         context.subscriptions.emitCssVersion(jscmd.arguments.version);
    //                     }
    //                 }
    //                 reader.readAsText(e.data);
    //             }
    //             else {
    //                 if (e.data === "api/changes") {
    //                     context.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
    //                 }
    //             }
    //         }

    //         if (context.appSettings.applicationMetaData.aliveInterval) {
    //             context.contentStore.setWsAndTimer(ws.current, new Timer(() => ws.current?.send("ALIVE"), context.appSettings.applicationMetaData.aliveInterval));
    //         }
            
    //         // setInterval(() => {
    //         //     if (!maxTriesExceeded.current) {
    //         //         if (retryCounter.current < maxRetries) {
    //         //             ws.current?.send("ALIVE");
    //         //             if (aliveSent.current) {
    //         //                 retryCounter.current++;
    //         //                 context.subscriptions.emitDialog(
    //         //                     "server", 
    //         //                     false, 
    //         //                     "Alive Check failed.", 
    //         //                     "The server did not respond to the alive check. The client is retrying to reach the server. Retry: " + retryCounter.current + " out of " + maxRetries)
    //         //                 if (retryCounter.current === 1) {
    //         //                     context.subscriptions.emitErrorDialogVisible(true);
    //         //                     errorDialogVisible.current = true;
    //         //                 }
    //         //             }
    //         //             else {
    //         //                 aliveSent.current = true;
    //         //                 retryCounter.current = 0;
    //         //             }
    //         //         }
    //         //         else {
    //         //             context.subscriptions.emitDialog("server", false, "Alive Check exceeded Max-Retries!", "The server did not respond after " + maxRetries + " tries to send the alive-check.");
    //         //             context.subscriptions.emitErrorDialogVisible(true);
    //         //             maxTriesExceeded.current = true;
    //         //         }
    //         //     }
    //         // }, 5000);
            

    //         // ws2.current = new WebSocket("ws://localhost:666");
    //         // ws2.current.onopen = () => {
    //         //     console.log('ws2 opened')
    //         //     ws2.current!.send("test")
    //         // };
    //     }

    //     const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, startupRequestHash:string, restartArgs?:any) => {
    //         if (restartArgs) {
    //             (req as StartupRequest).arguments = restartArgs;
    //             relaunchArguments.current = null;
    //         }
    //         newServer.sendRequest(req, (preserve && startupRequestHash && !restartArgs) ? REQUEST_KEYWORDS.UI_REFRESH : REQUEST_KEYWORDS.STARTUP)
    //         .then(result => {
    //             if (!preserve) {
    //                 sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
    //             }
    //             afterStartup(result)
    //         });
    //     }

    //     const afterStartup = (results:BaseResponse[]) => {
    //         if (!(results.length === 1 && results[0].name === RESPONSE_NAMES.SESSION_EXPIRED)) {
    //             subCopy.emitErrorDialogVisible(false);
    //         }

    //         initWS(newServer.BASE_URL);
    //     }

    //     const fetchAppConfig = () => {
    //         return new Promise<any>((resolve, reject) => {
    //             fetch('assets/config/app.json').then((r) => r.json())
    //             .then((data) => {
    //                 if (data.timeout) {
    //                     newServer.timeoutMs = parseInt(data.timeout)
    //                 }
    //                 resolve({});
    //             })
    //             .catch(() => reject("app.json not found"))
    //         });
    //     }

    //     const fetchVersionConfig = () => {
    //         return new Promise<any>((resolve, reject) => {
    //             fetch('assets/version/app_version.json').then((r) => r.json())
    //             .then((data) => {
    //                 if (data.version) {
    //                     appSettingsCopy.version = parseInt(data.version);
    //                     newServer.endpointMap = newServer.setEndPointMap(parseInt(data.version));
    //                     appVersion.version = parseInt(data.version)
    //                 }
    //                 resolve({});
    //             })
    //             .catch(() => reject("app_version.json not found"));
    //         });
    //     }

    //     const fetchConfig = () => {
    //         return new Promise<any>((resolve, reject) => {
    //             fetch('config.json')
    //             .then((r) => r.json())
    //             .then((data) => {
    //                 const dataMap = new Map(Object.entries(data));
    //                 dataMap.forEach((v, k) => {
    //                     if (k === "appName") {
    //                         startUpRequest.applicationName = v;
    //                     }
    //                     else if (["theme", "colorScheme"].indexOf(k) === -1) {
    //                         startUpRequest[k] = v;
    //                     }
    //                 });
    //                 newServer.BASE_URL = data.baseUrl;
        
    //                 if (data.logoBig) {
    //                     appSettingsCopy.LOGO_BIG = data.logoBig;
    //                 }
        
    //                 if (data.logoSmall) {
    //                     appSettingsCopy.LOGO_SMALL = data.logoSmall;
    //                 } 
    //                 else if (data.logoBig) {
    //                     appSettingsCopy.LOGO_SMALL = data.logoBig;
    //                 }
                        
    //                 if (data.logoLogin) {
    //                     appSettingsCopy.LOGO_LOGIN = data.logoLogin;
    //                 }
    //                 else if (data.logoBig) {
    //                     appSettingsCopy.LOGO_LOGIN = data.logoBig;
    //                 }
    
    //                 if (data.langCode) {
    //                     appSettingsCopy.language = data.langCode;
    //                 }
    
    //                 if (data.timezone) {
    //                     appSettingsCopy.timezone = data.timezone;
    //                 }
    
    //                 if (data.colorScheme) {
    //                     schemeToSet = data.colorScheme;
    //                 }
    
    //                 if (data.theme) {
    //                     themeToSet = data.theme;
    //                 }
    
    //                 if (data.design) {
    //                     designToSet = data.design;
    //                 }
    //                 resolve({})
    //             })
    //             .catch(() => reject("config.json not found"))
    //         });
    //     }
    //     //checks either url or embed options
    //     const checkExtraOptions = (options: URLSearchParams|{ [key:string]:any }) => {
    //         let convertedOptions:Map<string, any>;
    //         let appName;
    //         let baseUrl;

    //         if (options instanceof URLSearchParams) {
    //             convertedOptions = new Map(options);
    //         }
    //         else {
    //             newServer.embedOptions = options;
    //             convertedOptions = new Map(Object.entries(options));
    //         }

    //         if (convertedOptions.has("appName")) {
    //             appName = convertedOptions.get("appName") as string;
    //             if (appName.charAt(appName.length - 1) === "/") {
    //                 appName = appName.substring(0, appName.length - 1);
    //             }
    //             startUpRequest.applicationName = appName;
    //             convertedOptions.delete("appName");
    //         }

    //         if (convertedOptions.has("baseUrl")) {
    //             baseUrl = convertedOptions.get("baseUrl") as string;
    //             if (baseUrl.charAt(baseUrl.length - 1) === "/") {
    //                 baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    //             }
    //             newServer.BASE_URL = baseUrl;
    //             convertedOptions.delete("baseUrl");
    //         }
    //         else if (process.env.NODE_ENV === "production") {
    //             const splitURLPath = window.location.pathname.split("/");

    //             if (splitURLPath.length - 2 >= 3 || !splitURLPath[1]) {
    //                 newServer.BASE_URL = window.location.protocol + "//" + window.location.host + "/services/mobile"
    //             }
    //             else if (splitURLPath[1]) {
    //                 newServer.BASE_URL = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
    //             }
    //         }

    //         if (convertedOptions.has("layout") && ["standard", "corporation", "modern"].indexOf(convertedOptions.get("layout") as string) !== -1) {
    //             appSettingsCopy.setApplicationLayoutByURL(convertedOptions.get("layout") as "standard" | "corporation" | "modern");
    //         }

    //         if (convertedOptions.has("langCode")) {
    //             appSettingsCopy.language = convertedOptions.get("langCode");
    //         }

    //         if (convertedOptions.has("timezone")) {
    //             appSettingsCopy.timezone = convertedOptions.get("timezone");
    //         }

    //         if (convertedOptions.has("deviceMode")) {
    //             appSettingsCopy.deviceMode = convertedOptions.get("deviceMode");
    //         }

    //         if (convertedOptions.has("colorScheme")) {
    //             schemeToSet = convertedOptions.get("colorScheme");
    //             convertedOptions.delete("colorScheme");
    //         }

    //         if (props.colorScheme) {
    //             schemeToSet = props.colorScheme;
    //         }

    //         if (schemeToSet) {
    //             appSettingsCopy.setApplicationColorSchemeByURL(schemeToSet);
    //             addCSSDynamically('color-schemes/' + schemeToSet + '-scheme.css', "schemeCSS", appSettingsCopy);
    //         }

    //         if (convertedOptions.has("theme")) {
    //             themeToSet = convertedOptions.get("theme");
    //             convertedOptions.delete("theme");
    //         }

    //         if (props.theme) {
    //             themeToSet = props.theme;
    //         }

    //         if (themeToSet) {
    //             appSettingsCopy.setApplicationThemeByURL(themeToSet);
    //             addCSSDynamically('themes/' + themeToSet + '.css', "themeCSS", appSettingsCopy);
    //             subCopy.emitThemeChanged(themeToSet);
    //         }

    //         if (convertedOptions.has("design")) {
    //             designToSet = convertedOptions.get("design");
    //             convertedOptions.delete("design");
    //         }

    //         if (props.design) {
    //             designToSet = props.design;
    //         }

    //         if (designToSet) {
    //             appSettingsCopy.setApplicationDesign(designToSet);
    //             addCSSDynamically('design/' + designToSet + ".css", "designCSS", appSettingsCopy);
    //         }

    //         if (convertedOptions.has("version")) {
    //             appSettingsCopy.version = parseInt(convertedOptions.get("version"));
    //             newServer.endpointMap = newServer.setEndPointMap(parseInt(convertedOptions.get("version")));
    //             appVersion.version = parseInt(convertedOptions.get("version"));
    //         }

    //         convertedOptions.forEach((v, k) => {
    //             startUpRequest[k] = v;
    //         });
    //     }

    //     const afterConfigFetch = () => {
    //         checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams);

    //         startUpRequest.requestUri = window.location.href.substring(0, window.location.href.indexOf('#/') + 2);

    //         if(authKey) {
    //             startUpRequest.authKey = authKey;
    //         }
    //         startUpRequest.deviceMode = appSettingsCopy.deviceMode;
    //         startUpRequest.screenHeight = window.innerHeight;
    //         startUpRequest.screenWidth = window.innerWidth;
    //         if (csCopy.customStartUpProperties.length) {
    //             csCopy.customStartUpProperties.map(customProp => startUpRequest["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
    //         }

    //         const startupRequestHash = [
    //             'startup', 
    //             startUpRequest.appMode,
    //             startUpRequest.applicationName,
    //             startUpRequest.userName,
    //             startUpRequest.technology,
    //             startUpRequest.deviceMode,
    //         ].join('::');
    //         const startupRequestCache = sessionStorage.getItem(startupRequestHash);
    //         if (startupRequestCache && !relaunchArguments.current) {
    //             let preserveOnReload = false;
    //             (JSON.parse(startupRequestCache) as Array<any>).forEach((response) => {
    //                 if (response.preserveOnReload) {
    //                     preserveOnReload = true;
    //                 }
    //             });
    //             if (preserveOnReload) {
    //                 for (let [, value] of newServer.subManager.jobQueue.entries()) {
    //                     value();
    //                 }
    //                 newServer.subManager.jobQueue.clear();
    //             }
    //             sendStartup(preserveOnReload ? createUIRefreshRequest() : startUpRequest, preserveOnReload, startupRequestHash);
    //         } 
    //         else {
    //             sendStartup(startUpRequest, false, startupRequestHash, relaunchArguments.current);
    //         }
    //     } 

    //     if (process.env.NODE_ENV === "development") {
    //         Promise.all([fetchConfig(), fetchAppConfig(), fetchVersionConfig()])
    //         .then(() => checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams))
    //         .catch(() => checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams))
    //     }
    //     else {
    //         Promise.all([fetchAppConfig(), fetchVersionConfig()])
    //         .then(() => checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams))
    //         .catch(() => checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams))
    //     }
    // }, [])

    return (
        <appContext.Provider value={contextState}>
            {props.children}
        </appContext.Provider>
    )
}
export default AppProvider


