/** React imports */
import React, { FC, useContext, useEffect, useRef, useState } from 'react';

/** 3rd Party imports */
import { Toast, ToastMessage, ToastMessageType } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
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
import { createStartupRequest } from "./main/factories/RequestFactory";
import { ICustomContent } from "./MiddleMan";
import TopBar from './main/components/topbar/TopBar';
import { useEventHandler } from './main/components/zhooks';

//import CustomHelloScreen from "./frontmask/customScreen/CustomHelloScreen";
//import CustomChartScreen from "./frontmask/customScreen/CustomChartScreen";


/** Types for querystring parsing */
type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

type serverFailMessage = {
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

    /** History of react-router-dom */
    const history = useHistory();

    /** State of the current app-name to display it in the header */
    const [appName, setAppName] = useState<string>();

    /** Register custom content flip value, changes value when custom content needs to be re-registered */
    const [registerCustom, setRegisterCustom] = useState<boolean>(false);
    /** State if the app is ready */

    const [appReady, setAppReady] = useState<boolean>(false);
    /** If true the timeout dialog gets displayed */

    /** State if timeout error should be shown */
    const [showTimeOut, setShowTimeOut] = useState<boolean>(false);

    /** Reference for the dialog which shows the timeout error message */
    const dialogRef = useRef<serverFailMessage>({headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server."})

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
    useEffect(() => {
        context.subscriptions.subscribeToAppReady(() => setAppReady(true));
        context.subscriptions.subscribeToRegisterCustom(() => setRegisterCustom(registerCustom => !registerCustom));

        return () => {
            context.subscriptions.unsubscribeFromAppReady();
            context.subscriptions.unsubscribeFromRegisterCustom();
        }
    },[context.subscriptions]);

    /** Only necessary for testing purposes. It either sets a new CustomScreen or replaces screens/components */
    // useEffect(() => {
    //     context.contentStore.registerCustomOfflineScreen("FirstOfflineScreen", "Custom Group", <CustomHelloScreen/>);
    //     context.contentStore.registerReplaceScreen("Cha-OL", <CustomChartScreen/>);
    //     context.contentStore.registerCustomComponent("Fir-N7_B_DOOPEN", <CustomHelloScreen/>);
    // }, [context.contentStore, registerCustom]);

    /** Sets custom- or replace screens/components when reactUI is used as library based on props */
    useEffect(() => {
        props.customScreens?.forEach(s => {
            if (s.replace) {
                context.contentStore.registerReplaceScreen(s.name, s.screen)
            } else {
                context.contentStore.registerCustomOfflineScreen(s.name, s.menuGroup, s.screen, s.icon)
            }
        });

        props.customComponents?.forEach(rc => context.contentStore.registerCustomComponent(rc.name, rc.component));
        props.screenWrappers?.forEach(sw => context.contentStore.registerScreenWrapper(sw.screen, sw.wrapper, sw.options))
    },[context.contentStore, props.customScreens, props.customComponents, props.screenWrappers, registerCustom]);

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
        .set("Change password", "Change password");
    },[context.contentStore])

    /**
     * On reload navigate to home, fetch config.json if some fields are not configured, warns user with toast.
     * Sets StartupRequest-, Server- and Contentstore properties based on config file or queryString (URL)
     * Sets Appname for header, and sends StartupRequest.
     */
    useEffect(() => {
        history.replace("/home")
        const queryParams: queryType = queryString.parse(window.location.search);
        const authKey = localStorage.getItem("authKey");

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
            if (props.customStartupProps?.length) {
                props.customStartupProps.map(customProp => startupReq["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
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
            if(startupRequestCache) {
                for (let [, value] of context.server.subManager.jobQueue.entries()) {
                    value();
                }
                context.server.subManager.jobQueue.clear();
                context.server.responseHandler(JSON.parse(startupRequestCache));
            } else {
                context.server.sendRequest(startupReq, REQUEST_ENDPOINTS.STARTUP).then(result => {
                    sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
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
                context.contentStore.LOGO_BIG = data.logoBig;
            if (data.logoSmall)
                context.contentStore.LOGO_SMALL = data.logoSmall;
            else if (data.logoBig)
                context.contentStore.LOGO_SMALL = data.logoBig;
            if (data.logoLogin)
                context.contentStore.LOGO_LOGIN = data.logoLogin;
            else if (data.logoBig)
                context.contentStore.LOGO_LOGIN = data.logoBig;
            startUpRequest.userName = data.username;
            startUpRequest.password = data.password;
            startUpRequest.language = data.language ? data.language : 'de';

            startUpByURL(startUpRequest)
        }).catch(() => {
            startUpByURL(startUpRequest);
        })
    }, [context.server, context.contentStore, history, props.customStartupProps, context.subscriptions]);

    /**
     * Method to show a toast
     * @param {ToastMessage} messageObj - PrimeReact ToastMessage object which contains display information for toast
     */
    const msg = (messageObj:ToastMessageType, err:boolean) => {
        if (toastErrRef.current && toastInfoRef.current) {
            if (err) {
                toastErrRef.current.show(messageObj)
            }
            else {
                (messageObj as ToastMessage).content = (
                    <div className="p-flex p-flex-column" style={{ display: 'flex', flex: '1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', color: 'white', background: "#347fae" }}>
                            <span style={{ alignSelf: 'center', fontSize: '1rem', fontWeight: "bold" }}>Information Message</span>
                            <i className="pi pi-info-circle" style={{ fontSize: '2rem'}}></i>
                        </div>
                        <div style={{ padding: "1.5rem 1rem" }}>
                            {(messageObj as ToastMessage).summary}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: "0 0.5rem 0.5rem 0.5rem"}}>
                            <Button type="button" label="OK" onClick={() => toastInfoRef.current!.clear()} />
                        </div>
                    </div>
                )
                toastInfoRef.current.show(messageObj);
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
            {appReady
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
