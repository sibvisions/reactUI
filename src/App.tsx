/** React imports */
import React, {FC, useContext, useEffect, useRef, useState} from 'react';

/** 3rd Party imports */
import {Toast, ToastMessage} from 'primereact/toast';
import PrimeReact from 'primereact/api';
import * as queryString from "querystring";
import {Helmet} from "react-helmet";
import {Route, Switch, useHistory} from "react-router-dom";

/** UI imports */
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
//import Settings from "./frontmask/settings/Settings"

/** Other imports */
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";
import {checkEmptyConfProperties} from './JVX/components/util/CheckProperties';
//import CustomHelloScreen from "./frontmask/customScreen/CustomHelloScreen";
//import CustomChartScreen from "./frontmask/customScreen/CustomChartScreen";
import {ICustomContent} from "./MiddleMan"

/** Types for querystring parsing */
type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const App: FC<ICustomContent> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Toast reference to use the show method of toast */
    const toastRef = useRef<Toast>(null);
    /** History of react-router-dom */
    const history = useHistory()
    /** State of the current app-name to display it in the header */
    const [appName, setAppName] = useState<string>();
    /** Register custom content flip value, changes value when custom content needs to be re-registered */
    const [registerCustom, setRegisterCustom] = useState<boolean>(false);
    /** PrimeReact ripple effect */
    PrimeReact.ripple = true

    /**
     * Subscribes to session-expired notification
     * @returns unsubscribes from session
     */
    useEffect(() => {
        context.subscriptions.subscribeToRegisterCustom(() => setRegisterCustom(registerCustom => !registerCustom));
        return () => context.subscriptions.unsubscribeFromRegisterCustom();
    },[context.subscriptions]);

    /** Only necessary for testing purposes. It either sets a new CustomScreen or replaces screens/components */
    // useEffect(() => {
    //     context.contentStore.registerCustomOfflineScreen("FirstOfflineScreen", "Custom Group", <CustomHelloScreen/>);
    //     context.contentStore.registerReplaceScreen("Cha-OL", <CustomChartScreen/>);
    //     context.contentStore.registerCustomComponent("Fir-N7_B_DOOPEN", <CustomHelloScreen/>);
    // }, [context.contentStore, registerCustom]);

    /** Sets custom- or replace screens/components when reactUI is used as library based on props */
    useEffect(() => {
        props.customScreens?.forEach(cs => context.contentStore.registerCustomOfflineScreen(cs.screenName, cs.menuGroup, cs.customScreen, cs.icon));

        props.replaceScreens?.forEach(rs => context.contentStore.registerReplaceScreen(rs.screenToReplace, rs.replaceScreen));

        props.customComponents?.forEach(rc => context.contentStore.registerCustomComponent(rc.componentName, rc.customComp));
        props.customDisplays?.forEach(cd => context.contentStore.registerCustomDisplay(cd.screen, cd.customDisplay, cd.options))
    },[context.contentStore, props.customScreens, props.replaceScreens, props.customComponents, props.customDisplays, registerCustom]);

    /** Default values for translation */
    useEffect(() => {
        context.contentStore.translation
        .set("Username", "Username")
        .set("Password", "Password")
        .set("Login", "Login")
        .set("Logout", "Logout")
        .set("Settings", "Settings");
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
        fetch('config.json')
        .then((r) => r.json())
        .then((data) => {
            const emptyConfProps = checkEmptyConfProperties(data);
            if (emptyConfProps.length > 0) {
                let propsToPrint = ""
                emptyConfProps.forEach((emptyProp:string) => {
                    propsToPrint += emptyProp + ", "
                })
                const warnMsg = propsToPrint + "field(s) is/are not configured in the config.json file!"
                msg({severity: 'warn', summary: warnMsg})
                console.warn(warnMsg)
            }
            const startUpRequest = createStartupRequest();

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

            if(queryParams.appName && queryParams.baseUrl){
                startUpRequest.applicationName = queryParams.appName;
                context.server.APP_NAME = queryParams.appName;
                context.server.BASE_URL = queryParams.baseUrl;
                context.server.RESOURCE_URL = queryParams.baseUrl + "/resource/" + queryParams.appName
            }
            if(queryParams.userName && queryParams.password){
                startUpRequest.password = queryParams.password;
                startUpRequest.userName = queryParams.userName;
            }
            if(authKey){
                startUpRequest.authKey = authKey;
            }
            setAppName(context.server.APP_NAME);
            context.subscriptions.notifyScreenNameChanged(context.server.APP_NAME);
            startUpRequest.deviceMode = data.deviceMode ? data.deviceMode : "desktop";
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            if (props.customStartupProps?.length) {
                props.customStartupProps.map(customProp => startUpRequest["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
            }
            context.server.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
            context.server.showToast = msg
        }).catch(() => {
            msg({severity: 'error', summary: 'config.json file could not be loaded. Make sure there is a config.json file in your public folder.', life: 5000});
        })
    }, [context.server, context.contentStore, history, props.customStartupProps, context.subscriptions]);

    /**
     * Method to show a toast
     * @param {ToastMessage} messageObj - PrimeReact ToastMessage object which contains display information for toast
     */
    const msg = (messageObj: ToastMessage) => {
        if (toastRef.current) {
            toastRef.current.show(messageObj)
        }
    }

    return (
        <>
            <Helmet>
                <title>{appName ? appName : "VisionX Web"}</title>
            </Helmet>
            <Toast ref={toastRef} position="top-right"/>
                <Switch>
                    <Route exact path={"/login"} render={() => <Login />}/>
                    <Route exact path={"/home/:componentId"} render={routeProps => <Home key={routeProps.match.params.componentId} />} />
                    {/* <Route exact path={"/settings"} render={() => <Settings />}/> */}
                    <Route path={"/home"} render={() => <Home key={'homeBlank'} />} />
                </Switch>   
        </>
  );
}
export default App;
