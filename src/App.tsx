//React
import React, {FC, useContext, useEffect, useLayoutEffect} from 'react';

//Custom
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";

//UI
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import * as queryString from "querystring";
import {HashRouter, Route, Switch, useHistory} from "react-router-dom";
import history from "history/hash"



type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

const App: FC = () => {
    const context = useContext(jvxContext);

    useLayoutEffect(() => {
        const queryParams: queryType = queryString.parse(window.location.search);
        const startUpRequest = createStartupRequest();
        const authKey = localStorage.getItem("authKey");
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
    }, [context.server]);

    return (
        <HashRouter>
            <Switch>
                <Route exact path={"/login"}>
                    <Login />
                </Route>
                <Route exact  path={"/home/:componentId"}>
                    <Home />
                </Route>
                <Route  path={"/home"}>
                    <Home />
                </Route>
            </Switch>
      </HashRouter>
  );
}
export default App;
