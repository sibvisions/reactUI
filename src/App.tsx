/** React imports */
import React, { FC, useContext, useEffect, useRef, useState } from 'react';

/** 3rd Party imports */
import { Toast, ToastMessage, ToastMessageType } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import PrimeReact from 'primereact/api';
import * as queryString from "querystring";
import { Helmet } from "react-helmet";
import { Route, Switch, useHistory, useRouteMatch } from "react-router-dom";

/** UI imports */
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import LoadingScreen from './frontmask/loading/loadingscreen';
//import Settings from "./frontmask/settings/Settings"

/** Other imports */
import { REQUEST_ENDPOINTS, StartupRequest } from "./main/request";
import { appContext } from "./main/AppProvider";
import { createChangesRequest, createPressButtonRequest, createStartupRequest, createUIRefreshRequest, getClientId } from "./main/factories/RequestFactory";
import { ICustomContent } from "./MiddleMan";
import TopBar, { showTopBar, TopBarContext } from './main/components/topbar/TopBar';
import { useEventHandler, useTranslation } from './main/components/zhooks';
import { DialogResponse } from './main/response';
import { concatClassnames } from './main/components/util';

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

    /** Toast reference for error messages */
    const toastErrRef = useRef<Toast>(null);
    
    /** Toast reference for information messages */
    const toastInfoRef = useRef<Toast>(null);

    const toastIndex = useRef<number>(0);

    /** History of react-router-dom */
    const history = useHistory();

    /** State of the current app-name to display it in the header */
    const [appName, setAppName] = useState<string>();

    /** Register custom content flip value, changes value when custom content needs to be re-registered */
    const [registerCustom, setRegisterCustom] = useState<boolean>(false);
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

    /** the currently requested componentId */
    let routeMatch = useRouteMatch<{ componentId: string }>("/home/:componentId");

    const ws = useRef<WebSocket|null>(null);

    const translation = useTranslation();

    const topbar = useContext(TopBarContext)

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
    useEffect(() => {
        context.subscriptions.subscribeToAppReady(() => setAppReady(true));
        context.subscriptions.subscribeToRegisterCustom(() => setRegisterCustom(registerCustom => !registerCustom));
        context.subscriptions.subscribeToSessionExpired(() => setSessionExpired(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromAppReady();
            context.subscriptions.unsubscribeFromRegisterCustom();
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
        const queryParams: queryType = queryString.parse(window.location.search);
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
            if(queryParams.appName && queryParams.baseUrl){
                startupReq.applicationName = queryParams.appName;
                context.server.APP_NAME = queryParams.appName;
                context.server.BASE_URL = queryParams.baseUrl;
                context.server.RESOURCE_URL = queryParams.baseUrl + "/resource/" + queryParams.appName
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

            context.server.showToast = msg;
            context.showToast = msg;
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
            context.contentStore.setOnMenuFunc(props.onMenu);
        }

        if (props.onOpenScreen) {
            context.contentStore.setOnOpenScreenFunc(props.onOpenScreen);
        }

    }, [context.contentStore, registerCustom]);

    /**
     * Method to show a toast
     * @param {ToastMessage} messageObj - PrimeReact ToastMessage object which contains display information for toast
     */
    const msg = (messageObj: ToastMessageType, err: boolean, dialogResponse?:DialogResponse) => {
        if (toastErrRef.current && toastInfoRef.current && toastIndex.current !== null) {
            if (err) {
                toastErrRef.current.show(messageObj);
                toastIndex.current++;
            }
            else {
                //TODO: Maybe in the future PrimeReact will release a "proper" way to close a single toast message.
                //Currently they only allow us to use the clear function which clears every toast message.
                const handleClose = (target:HTMLElement) => {
                    const idHelper = target.closest(".index-helper");
                    let id = -1;
                    idHelper?.classList.forEach(className => {
                        if (className.includes("toast-")) {
                            id = parseInt(className.substring(6));
                        }
                    });
                    if (id !== -1) {
                        const newMessages = [...toastInfoRef.current?.state.messages].filter(message => message.id !== id);
                        toastInfoRef.current?.setState({ messages: newMessages });
                    }
                }

                const headerContent = (iconType:0|1|2|3|9):{icon:string, text:string} => {
                    if (iconType === 0) {
                        return { text: translation.get("Information") as string, icon: "pi pi-info-circle" };
                    }
                    else if (iconType === 1) {
                        return { text: translation.get("Error") as string, icon: "pi pi-times-circle" };
                    }
                    else if (iconType === 2) {
                        return { text: translation.get("Warning") as string, icon: "pi pi-exclamation-circle" };
                    }
                    else if (iconType === 3) {
                        return { text: translation.get("Question") as string, icon: "pi pi-question-circle" };
                    }
                    else {
                        return { text: "", icon: "" };
                    }
                }

                const footerContent = (buttonType:4|5|6|7|8, okCompId?:string, cancelCompId?:string, notOkCompId?:string) => {
                    const sendPressOk = () => {
                        if (okCompId) {
                            const pressBtnReq = createPressButtonRequest();
                            pressBtnReq.componentId = okCompId;
                            showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar)
                        }
                    }
                    
                    const sendPressCancel = () => {
                        if (cancelCompId) {
                            const pressBtnReq = createPressButtonRequest();
                            pressBtnReq.componentId = cancelCompId;
                            showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar)
                        }
                    }

                    const sendPressNo = () => {
                        if (notOkCompId) {
                            const pressBtnReq = createPressButtonRequest();
                            pressBtnReq.componentId = notOkCompId;
                            showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar)
                        }
                    }

                    if (buttonType === 4 || buttonType === 5) {
                        return (
                            <>
                                <Button type="button" label={buttonType === 4 ? translation.get("Cancel") : translation.get("No")} onClick={event => {
                                    sendPressCancel();
                                    handleClose(event.target as HTMLElement);
                                }} />
                                <Button type="button" label={buttonType === 4 ? translation.get("OK") : translation.get("Yes")} onClick={event => {
                                    sendPressOk();
                                    handleClose(event.target as HTMLElement);
                                }} />    
                            </>                            
                        )
                    }
                    else if (buttonType === 6) {
                        return (
                            <Button type="button" label={translation.get("OK")} onClick={event => {
                                sendPressOk();
                                handleClose(event.target as HTMLElement);
                            }} />
                        )
                    }
                    else if (buttonType === 7) {
                        return (
                            <>
                                <div>
                                    <Button type="button" label={translation.get("Cancel")} onClick={event => {
                                        sendPressCancel();
                                        handleClose(event.target as HTMLElement);
                                    }} />
                                    <Button type="button" label={translation.get("No")} onClick={event => {
                                        sendPressNo();
                                        handleClose(event.target as HTMLElement);
                                    }} />
                                </div>
                                <Button type="button" label={translation.get("Yes")} onClick={event => {
                                    sendPressOk();
                                    handleClose(event.target as HTMLElement);
                                }} />
                            </>
                        )
                    }
                    else {
                        return
                    }
                }

                const getHeaderType = (iconType:0|1|2|3|9) => {
                    if (iconType === 0) {
                        return "info";
                    }
                    else if (iconType === 1) {
                        return "warning";
                    }
                    else if (iconType === 2) {
                        return "error";
                    }
                    else if (iconType === 3) {
                        return "question";
                    }
                }

                (messageObj as ToastMessage).content = 
                    (dialogResponse) ? (
                        <div className={concatClassnames("p-flex", "p-flex-column", "index-helper", "toast-" + toastIndex.current)}>
                            <div className={concatClassnames("toast-header", getHeaderType(dialogResponse.iconType))}>
                                <span className="toast-header-text">{headerContent(dialogResponse.iconType).text}</span>
                                <i className={concatClassnames("toast-header-icon", headerContent(dialogResponse.iconType).icon)} />
                            </div>
                            <div className="toast-content">
                                {(messageObj as ToastMessage).summary}
                            </div>
                            <div className={concatClassnames("toast-footer", dialogResponse.buttonType === 6 ? "single-button" : "more-buttons")}>
                                {footerContent(dialogResponse.buttonType, dialogResponse.okComponentId, dialogResponse.cancelComponentId, dialogResponse.notOkComponentId)}
                            </div>
                            
                        </div>
                    )
                : (
                    <div className={concatClassnames("p-flex", "p-flex-column", "index-helper", "toast-" + toastIndex.current)}>
                         <div className={concatClassnames("toast-header", "info")}>
                            <span className="toast-header-text">{translation.get("Information")}</span>
                            <i className="toast-header-icon pi pi-info-circle" />
                        </div>
                        <div className="toast-content">
                            {(messageObj as ToastMessage).summary}
                        </div>
                        <div className={concatClassnames("toast-footer", "single-button")}>
                            <Button type="button" label="OK" onClick={(event) => {
                                handleClose(event.target as HTMLElement);
                            }} />
                        </div>
                    </div>
                )

                toastInfoRef.current.show(messageObj);
                if (dialogResponse && dialogResponse.resizable !== false) {
                    //@ts-ignore
                    const toastElem = toastInfoRef.current.container.querySelector('.toast-' + toastIndex.current).closest(".p-toast-message") as HTMLElement;
                    toastElem.style.setProperty('overflow', 'auto');
                    toastElem.style.setProperty('resize', 'both');
                    (toastElem.children[0] as HTMLElement).style.setProperty('height', 'inherit');
                    (toastElem.children[0] as HTMLElement).style.setProperty('width', 'inherit');
                    (toastElem.children[0].children[0] as HTMLElement).style.setProperty('height', 'inherit');
                    (toastElem.children[0].children[0] as HTMLElement).style.setProperty('width', 'inherit');
                }
                toastIndex.current++;
            }
        }
    }

    

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
            <Toast id="toastErr" ref={toastErrRef} position="top-right" />
            <Toast id="toastInfo" ref={toastInfoRef} position="center" />
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
