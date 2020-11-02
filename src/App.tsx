//React
import React, {createContext, FC, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';

//Custom
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";

//prime
import {Toast, ToastMessage} from 'primereact/toast';

//UI
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import Settings from "./frontmask/settings/Settings"
import * as queryString from "querystring";
import {HashRouter, Route, Switch, useHistory} from "react-router-dom";
import history from "history/hash"
import { checkProperties } from './JVX/components/util/CheckProperties';



type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

export const toastContext = createContext<Function>(() => {})

const App: FC = () => {
    const context = useContext(jvxContext);
    const toastRef = useRef<Toast>(null);

    useLayoutEffect(() => {
        const queryParams: queryType = queryString.parse(window.location.search);
        const authKey = localStorage.getItem("authKey");
        fetch('config.json')
        .then((r) => r.json())
        .then((data) => {
            const emptyConfProps = checkProperties(data);
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

            startUpRequest.applicationName = data.APP_NAME;
            context.server.APP_NAME = data.APP_NAME;
            context.server.BASE_URL = data.BASE_URL;
            context.server.RESOURCE_URL = data.BASE_URL + "/resource" + data.APP_NAME;
            startUpRequest.userName = data.USERNAME;
            startUpRequest.password = data.PASSWORD;

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
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            context.server.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
            context.server.showToast = msg
        })
    }, [context.server]);

    const msg = (messageObj: ToastMessage) => {
        if (toastRef.current) {
            toastRef.current.show(messageObj)
        }
    }

    return (
        <HashRouter>
            <Toast ref={toastRef} position="top-right"/>
            <toastContext.Provider value={msg}>
                <Switch>
                    <Route exact path={"/login"}>
                        <Login />
                    </Route>
                    <Route exact  path={"/home/:componentId"}>
                        <Home />
                    </Route>
                    <Route exact path={"/settings"}>
                        <Settings />
                    </Route>
                    <Route  path={"/home"}>
                        <Home />
                    </Route>
                </Switch>   
            </toastContext.Provider>
      </HashRouter>
  );
}
export default App;
