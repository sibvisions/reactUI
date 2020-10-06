//React
import React, {FC, useContext, useLayoutEffect} from 'react';
import {Route, Router, Switch} from "react-router";
import { createBrowserHistory } from "history"

//Custom
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";

//UI
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import * as queryString from "querystring";


export const browserHistory = createBrowserHistory();

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
            context.server.BASE_URL = queryParams.baseUrl;
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
    });

    return (
        <Router history={browserHistory} >
            <Switch>
                <Route path={"/login"}>
                    <Login />
                </Route>
                <Route path={"/home/:componentId"}>
                    <Home />
                </Route>
                <Route path={"/home"}>
                    <Home />
                </Route>
            </Switch>
      </Router>
  );
}
export default App;
