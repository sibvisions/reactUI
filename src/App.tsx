/** React imports */
import React, { FC, useContext, useEffect, useRef, useState } from 'react';

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';
import PrimeReact from 'primereact/api';
import * as queryString from "querystring";
import { Helmet } from "react-helmet";
import { Route, Switch, useHistory } from "react-router-dom";

/** UI imports */
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import LoadingScreen from './frontmask/loading/loadingscreen';
//import Settings from "./frontmask/settings/Settings"

/** Other imports */
import { REQUEST_ENDPOINTS, StartupRequest } from "./main/request";
import { appContext } from "./main/AppProvider";
import { createChangesRequest, createStartupRequest, createUIRefreshRequest, getClientId } from "./main/factories/RequestFactory";
import { ICustomContent } from "./MiddleMan";
import TopBar from './main/components/topbar/TopBar';
import { useEventHandler } from './main/components/zhooks';
import UIToast from './main/components/toast/UIToast';

//import CustomHelloScreen from "./frontmask/customScreen/CustomHelloScreen";
//import CustomChartScreen from "./frontmask/customScreen/CustomChartScreen";


/** Types for querystring parsing */
type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

type ServerFailMessage = {
    headerMessage:string,
    bodyMessage:string
}

/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const App: FC<ICustomContent> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** State of the current app-name to display it in the header */
    const [appName, setAppName] = useState<string>();

    /** State if the app is ready */
    const [appReady, setAppReady] = useState<boolean>(false);

    const [startupDone, setStartupDone] = useState<boolean>(false);

    const [sessionExpired, setSessionExpired] = useState<boolean>(false);

    /** State if timeout error should be shown */
    const [showTimeOut, setShowTimeOut] = useState<boolean>(false);

    /** Reference for the dialog which shows the timeout error message */
    const dialogRef = useRef<ServerFailMessage>({headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server."})

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true

    const ws = useRef<WebSocket|null>(null);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
    useEffect(() => {
        context.subscriptions.subscribeToAppReady(() => setAppReady(true));
        context.subscriptions.subscribeToSessionExpired(() => setSessionExpired(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromAppReady();
            context.subscriptions.unsubscribeFromSessionExpired();
        }
    },[context.subscriptions]);

    /** Only necessary for testing purposes. It either sets a new CustomScreen or replaces screens/components */
    // useEffect(() => {
    //     context.contentStore.registerCustomOfflineScreen("FirstOfflineScreen", "Custom Group", <CustomHelloScreen/>);
    //     context.contentStore.registerReplaceScreen("Cha-OL", <CustomChartScreen/>);
    //     context.contentStore.registerCustomComponent("Fir-N7_B_DOOPEN", <CustomHelloScreen/>);
    // }, [context.contentStore, registerCustom]);

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
        .set("No", "No");
    },[context.contentStore])

    /**
     * On reload navigate to home, fetch config.json if some fields are not configured, warns user with toast.
     * Sets StartupRequest-, Server- and Contentstore properties based on config file or queryString (URL)
     * Sets Appname for header, and sends StartupRequest.
     */
    useEffect(() => {
        const queryParams: queryType = queryString.parse(window.location.search.includes("?") ? window.location.search.split("?")[1] : window.location.search);
        const authKey = localStorage.getItem("authKey");

        if (props.onStartup) {
            props.onStartup();
        }

        const initWS = (baseURL:string) => {
            const urlSubstr = baseURL.substring(context.server.BASE_URL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));
            ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId());
            ws.current.onopen = () => console.log("ws opened");
            ws.current.onclose = () => console.log("ws closed");
            ws.current.onmessage = (e) => {
                if (e.data === "api/changes") {
                    context.server.sendRequest(createChangesRequest(), REQUEST_ENDPOINTS.CHANGES);
                }
            }
        }

        const startUpByURL = (startupReq:StartupRequest) => {
            if(queryParams.appName && queryParams.baseUrl) {
                startupReq.applicationName = queryParams.appName;
                context.server.APP_NAME = queryParams.appName;
                let baseUrl = queryParams.baseUrl;
                if (queryParams.baseUrl.charAt(queryParams.baseUrl.length - 1) === "/") {
                    baseUrl = queryParams.baseUrl.substring(0, queryParams.baseUrl.length - 1);
                }
                context.server.BASE_URL = baseUrl;
                context.server.RESOURCE_URL = baseUrl + "/resource/" + queryParams.appName
            }
            if(queryParams.userName && queryParams.password){
                startupReq.password = queryParams.password;
                startupReq.userName = queryParams.userName;
            }
            if(authKey){
                startupReq.authKey = authKey;
            }
            setAppName(context.server.APP_NAME);
            context.subscriptions.notifyScreenNameChanged(context.server.APP_NAME);
            startupReq.deviceMode = "desktop";
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
            if (startupRequestCache) {
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
                    context.server.sendRequest(createUIRefreshRequest(), REQUEST_ENDPOINTS.UI_REFRESH).then(() => {
                        setStartupDone(true);
                        initWS(context.server.BASE_URL);
                    });
                }
                else {
                    context.server.sendRequest(startupReq, REQUEST_ENDPOINTS.STARTUP).then(result => {
                        sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
                        setStartupDone(true);
                        initWS(context.server.BASE_URL);
                    });
                }
            } else {
                context.server.sendRequest(startupReq, REQUEST_ENDPOINTS.STARTUP).then(result => {
                    sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
                    setStartupDone(true);
                    initWS(context.server.BASE_URL);
                });
            }
            context.server.showDialog = showDialog;
        }

        const startUpRequest = createStartupRequest();
        fetch('config.json')
        .then((r) => r.json())
        .then((data) => {
            startUpRequest.applicationName = data.appName;
            context.server.APP_NAME = data.appName;
            context.server.BASE_URL = data.baseURL;
            context.server.RESOURCE_URL = data.baseURL + "/resource/" + data.appName;
            if (data.logoBig)
                context.appSettings.LOGO_BIG = data.logoBig;
            if (data.logoSmall)
                context.appSettings.LOGO_SMALL = data.logoSmall;
            else if (data.logoBig)
                context.appSettings.LOGO_SMALL = data.logoBig;
            if (data.logoLogin)
                context.appSettings.LOGO_LOGIN = data.logoLogin;
            else if (data.logoBig)
                context.appSettings.LOGO_LOGIN = data.logoBig;
            startUpRequest.userName = data.username;
            startUpRequest.password = data.password;
            startUpRequest.language = data.language ? data.language : 'de';

            startUpByURL(startUpRequest)
        }).catch(() => {
            startUpByURL(startUpRequest);
        });

        return () => {
            ws.current?.close();
        }
    }, [context.server, context.contentStore, history, context.subscriptions, sessionExpired]);

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

    /**
     * Sets the showTimeOut state to show the dialog
     */
    const showDialog = (head:string, body:string) => {
        dialogRef.current.headerMessage = head;
        dialogRef.current.bodyMessage = body;
        setShowTimeOut(true);
    }

    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? context.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? context.ctrlPressed = false : undefined);
    
    /** When the app isn't ready, show the loadingscreen, if it is show normal */
    return (
        <>
            <Helmet>
                <title>{appName ? appName : "VisionX Web"}</title>
            </Helmet>
            <UIToast />
            <Dialog header="Server Error!" visible={showTimeOut} onHide={() => setShowTimeOut(false)} resizable={false}>
                <p>{dialogRef.current.bodyMessage.toString()}</p>
            </Dialog>
            <TopBar>
            {appReady && startupDone
                ? <Switch>
                    <Route exact path={"/login"} render={() => <Login />} />
                    <Route exact path={"/home/:componentId"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                    {/* <Route exact path={"/settings"} render={() => <Settings />}/> */}
                    <Route path={"/home"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                </Switch>
                : <LoadingScreen />
            }
            </TopBar>
        </>
  );
}
export default App;
