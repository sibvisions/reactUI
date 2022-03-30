import { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { appContext } from "../../AppProvider";
import { createChangesRequest, createOpenScreenRequest, createStartupRequest, createUIRefreshRequest, getClientId } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS, StartupRequest, UIRefreshRequest } from "../../request";
import { ICustomContent } from "../../../MiddleMan";
import { useEventHandler } from "..";
import { BaseResponse, RESPONSE_NAMES } from "../../response";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import { addCSSDynamically, Timer } from "../../util";
import { appVersion } from "../../AppSettings";

/**
 * Sends and handles the startup of the application
 */
const useStartup = (props:ICustomContent):boolean => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True, if the app is ready */
    const [appReady, setAppReady] = useState<boolean>(false);

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    const relaunchArguments = useRef<any>(null);

    const ws = useRef<WebSocket|null>(null);

    const ws2 = useRef<WebSocket|null>(null);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToAppReady((ready:boolean) => setAppReady(ready));
        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromAppReady();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    },[context.subscriptions]);

    /** Default values for translation */
    useEffect(() => {
        context.contentStore.translation
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
        .set("Take note of any unsaved data, and <u>click here</u> or press ESC to continue.", "Take note of any unsaved data, and <u>click here</u> or press ESC to continue.");
    },[context.contentStore]);

    /**
     * On reload navigate to home, fetch config.json if some fields are not configured, warns user with toast.
     * Sets StartupRequest-, Server- and Contentstore properties based on config file or URLSearchParams
     * Sets Appname for header, and sends StartupRequest.
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = localStorage.getItem("authKey");
        let themeToSet = "";
        let schemeToSet = "";
        let designToSet = "";

        if (props.onStartup) {
            props.onStartup();
        }

        const initWS = (baseURL:string) => {
            const urlSubstr = baseURL.substring(context.server.BASE_URL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));
            
            ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId());
            ws.current.onopen = () => console.log("ws opened");
            ws.current.onclose = () => console.log("ws closed");
            ws.current.onerror = () => console.error("ws error");
            ws.current.onmessage = (e) => {
                if (e.data instanceof Blob) {
                    const reader = new FileReader()

                    reader.onloadend = () => { 
                        let jscmd = JSON.parse(String(reader.result)); 
            
                        if (jscmd.command === "relaunch") {
                            context.contentStore.reset();
                            relaunchArguments.current = jscmd.arguments;
                            setRestart(prevState => !prevState);
                        }
                        else if (jscmd.command === "api/reopenScreen") {
                            const openReq = createOpenScreenRequest();
                            openReq.className = jscmd.arguments.className;
                            context.server.lastOpenedScreen = jscmd.arguments.className;
                            showTopBar(context.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), topbar);
                        }
                        else if (jscmd.command === "reloadCss") {
                            context.subscriptions.emitCssVersion(jscmd.arguments.version);
                        }
                    }
                    reader.readAsText(e.data);
                }
                else {
                    if (e.data === "api/changes") {
                        context.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
                    }
                }
            }

            if (context.appSettings.applicationMetaData.aliveInterval) {
                context.contentStore.setWsAndTimer(ws.current, new Timer(() => ws.current?.send("ALIVE"), context.appSettings.applicationMetaData.aliveInterval));
            }
            
            // setInterval(() => {
            //     if (!maxTriesExceeded.current) {
            //         if (retryCounter.current < maxRetries) {
            //             ws.current?.send("ALIVE");
            //             if (aliveSent.current) {
            //                 retryCounter.current++;
            //                 context.subscriptions.emitDialog(
            //                     "server", 
            //                     false, 
            //                     "Alive Check failed.", 
            //                     "The server did not respond to the alive check. The client is retrying to reach the server. Retry: " + retryCounter.current + " out of " + maxRetries)
            //                 if (retryCounter.current === 1) {
            //                     context.subscriptions.emitErrorDialogVisible(true);
            //                     errorDialogVisible.current = true;
            //                 }
            //             }
            //             else {
            //                 aliveSent.current = true;
            //                 retryCounter.current = 0;
            //             }
            //         }
            //         else {
            //             context.subscriptions.emitDialog("server", false, "Alive Check exceeded Max-Retries!", "The server did not respond after " + maxRetries + " tries to send the alive-check.");
            //             context.subscriptions.emitErrorDialogVisible(true);
            //             maxTriesExceeded.current = true;
            //         }
            //     }
            // }, 5000);
            

            // ws2.current = new WebSocket("ws://localhost:666");
            // ws2.current.onopen = () => {
            //     console.log('ws2 opened')
            //     ws2.current!.send("test")
            // };
        }

        const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, startupRequestHash:string, restartArgs?:any) => {
            if (restartArgs) {
                (req as StartupRequest).arguments = restartArgs;
                relaunchArguments.current = null;
            }
            context.server.sendRequest(req, (preserve && startupRequestHash && !restartArgs) ? REQUEST_KEYWORDS.UI_REFRESH : REQUEST_KEYWORDS.STARTUP)
            .then(result => {
                if (!preserve) {
                    sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
                }
                afterStartup(result)
            });
        }

        const afterStartup = (results:BaseResponse[]) => {
            if (!(results.length === 1 && results[0].name === RESPONSE_NAMES.SESSION_EXPIRED)) {
                context.subscriptions.emitErrorDialogVisible(false);
            }

            initWS(context.server.BASE_URL);
        }

        const setStartupProperties = (startupReq:StartupRequest, options?:URLSearchParams|{ [key:string]:any }) => {
            if (options) {
                let convertedOptions:Map<string, any>;
                let appName;
                let baseUrl;

                if (options instanceof URLSearchParams) {
                    convertedOptions = new Map(options);
                }
                else {
                    context.server.embedOptions = options;
                    convertedOptions = new Map(Object.entries(options));
                }

                if (convertedOptions.has("appName")) {
                    appName = convertedOptions.get("appName") as string;
                    if (appName.charAt(appName.length - 1) === "/") {
                        appName = appName.substring(0, appName.length - 1);
                    }
                    startupReq.applicationName = appName;
                    convertedOptions.delete("appName");
                }

                if (convertedOptions.has("baseUrl")) {
                    baseUrl = convertedOptions.get("baseUrl") as string;
                    if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                    }
                    context.server.BASE_URL = baseUrl;
                    convertedOptions.delete("baseUrl");
                }
                else if (process.env.NODE_ENV === "production") {
                    const splitURLPath = window.location.pathname.split("/");

                    if (splitURLPath.length - 2 >= 3 || !splitURLPath[1]) {
                        context.server.BASE_URL = window.location.protocol + "//" + window.location.host + "/services/mobile"
                    }
                    else if (splitURLPath[1]) {
                        context.server.BASE_URL = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
                    }
                }

                if (convertedOptions.has("layout") && ["standard", "corporation", "modern"].indexOf(convertedOptions.get("layout") as string) !== -1) {
                    context.appSettings.setApplicationLayoutByURL(convertedOptions.get("layout") as "standard" | "corporation" | "modern");
                }

                if (convertedOptions.has("langCode")) {
                    context.appSettings.language = convertedOptions.get("langCode");
                }

                if (convertedOptions.has("timezone")) {
                    context.appSettings.timezone = convertedOptions.get("timezone");
                }

                if (convertedOptions.has("deviceMode")) {
                    context.appSettings.deviceMode = convertedOptions.get("deviceMode");
                }

                if (convertedOptions.has("colorScheme")) {
                    schemeToSet = convertedOptions.get("colorScheme");
                    convertedOptions.delete("colorScheme");
                }

                if (props.colorScheme) {
                    schemeToSet = props.colorScheme;
                }

                if (schemeToSet) {
                    context.appSettings.setApplicationColorSchemeByURL(schemeToSet);
                    addCSSDynamically('color-schemes/' + schemeToSet + '-scheme.css', "schemeCSS", context.appSettings);
                }

                if (convertedOptions.has("theme")) {
                    themeToSet = convertedOptions.get("theme");
                    convertedOptions.delete("theme");
                }

                if (props.theme) {
                    themeToSet = props.theme;
                }

                if (themeToSet) {
                    context.appSettings.setApplicationThemeByURL(themeToSet);
                    addCSSDynamically('themes/' + themeToSet + '.css', "themeCSS", context.appSettings);
                    context.subscriptions.emitThemeChanged(themeToSet);
                }

                if (convertedOptions.has("design")) {
                    designToSet = convertedOptions.get("design");
                    convertedOptions.delete("design");
                }

                if (props.design) {
                    designToSet = props.design;
                }

                if (designToSet) {
                    context.appSettings.setApplicationDesign(designToSet);
                    addCSSDynamically('design/' + designToSet + ".css", "designCSS", context.appSettings);
                }

                if (convertedOptions.has("version")) {
                    context.appSettings.version = parseInt(convertedOptions.get("version"));
                    context.server.endpointMap = context.server.setEndPointMap(parseInt(convertedOptions.get("version")));
                    appVersion.version = parseInt(convertedOptions.get("version"));
                }

                convertedOptions.forEach((v, k) => {
                    startupReq[k] = v;
                });

                startupReq.requestUri = window.location.href.substring(0, window.location.href.indexOf('#/') + 2)

                if(authKey) {
                    startupReq.authKey = authKey;
                }
                startupReq.deviceMode = context.appSettings.deviceMode;
                startupReq.screenHeight = window.innerHeight;
                startupReq.screenWidth = window.innerWidth;
                if (context.contentStore.customStartUpProperties.length) {
                    context.contentStore.customStartUpProperties.map(customProp => startupReq["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
                }
    
                const startupRequestHash = [
                    'startup', 
                    startupReq.appMode,
                    startupReq.applicationName,
                    startupReq.userName,
                    startupReq.technology,
                    startupReq.deviceMode,
                ].join('::');
                const startupRequestCache = sessionStorage.getItem(startupRequestHash);
                if (startupRequestCache && !relaunchArguments.current) {
                    let preserveOnReload = false;
                    (JSON.parse(startupRequestCache) as Array<any>).forEach((response) => {
                        if (response.preserveOnReload) {
                            preserveOnReload = true;
                        }
                    });
                    if (preserveOnReload) {
                        for (let [, value] of context.server.subManager.jobQueue.entries()) {
                            value();
                        }
                        context.server.subManager.jobQueue.clear();
                    }
                    sendStartup(preserveOnReload ? createUIRefreshRequest() : startupReq, preserveOnReload, startupRequestHash);
                } 
                else {
                    sendStartup(startupReq, false, startupRequestHash, relaunchArguments.current);
                }
            }
        }

        const fetchAppConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/config/app.json').then((r) => r.json())
                .then((data) => {
                    if (data.timeout) {
                        context.server.timeoutMs = parseInt(data.timeout)
                    }
                    resolve({});
                })
                .catch(() => reject("app.json not found"))
            });
        }

        const fetchVersionConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/version/app_version.json').then((r) => r.json())
                .then((data) => {
                    if (data.version) {
                        context.appSettings.version = parseInt(data.version);
                        context.server.endpointMap = context.server.setEndPointMap(parseInt(data.version));
                        appVersion.version = parseInt(data.version)
                    }
                    resolve({});
                })
                .catch(() => reject("app_version.json not found"));
            });
        }

        const startUpRequest = createStartupRequest();
        if (process.env.NODE_ENV === "development") {
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
                context.server.BASE_URL = data.baseUrl;
    
                if (data.logoBig) {
                    context.appSettings.LOGO_BIG = data.logoBig;
                }
    
                if (data.logoSmall) {
                    context.appSettings.LOGO_SMALL = data.logoSmall;
                } 
                else if (data.logoBig) {
                    context.appSettings.LOGO_SMALL = data.logoBig;
                }
                    
                if (data.logoLogin) {
                    context.appSettings.LOGO_LOGIN = data.logoLogin;
                }
                else if (data.logoBig) {
                    context.appSettings.LOGO_LOGIN = data.logoBig;
                }

                if (data.langCode) {
                    context.appSettings.language = data.langCode;
                }

                if (data.timezone) {
                    context.appSettings.timezone = data.timezone;
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

                // if (data.version) {
                //     context.appSettings.version = parseInt(data.version);
                //     context.server.endpointMap = context.server.setEndPointMap(parseInt(data.version));
                //     appVersion.version = parseInt(data.version)
                // }

                //setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams);
            }).then(() => {
                Promise.all([fetchAppConfig(), fetchVersionConfig()])
                .then(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams))
                .catch(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams));
                //fetchAppConfig();
            }).catch(() => {
                Promise.all([fetchAppConfig(), fetchVersionConfig()])
                .then(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams))
                .catch(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams));
                //fetchAppConfig();
            });
        }
        else {
            Promise.all([fetchAppConfig(), fetchVersionConfig()])
            .then(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams))
            .catch(() => setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams));
        }

        return () => {
            ws.current?.close();
        }
    }, [context.server, context.contentStore, context.subscriptions, history, restart]);

    /** Sets custom- or replace screens/components when reactUI is used as library based on props */
    useEffect(() => {
        if (props.onMenu) {
            context.server.setOnMenuFunction(props.onMenu);
        }

        if (props.onOpenScreen) {
            context.server.setOnOpenScreenFunction(props.onOpenScreen);
        }

        if (props.onLogin) {
            context.server.setOnLoginFunction(props.onLogin);
        }
    }, [context.contentStore]);

    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? context.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? context.ctrlPressed = false : undefined);

    return appReady
}
export default useStartup