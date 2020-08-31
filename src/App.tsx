//React
import React, {FC, useContext, useEffect} from 'react';
import {Redirect, Route, Router, Switch} from "react-router";
import { createBrowserHistory } from "history"

//Custom
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";

//UI
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";

export const browserHistory = createBrowserHistory();

const App: FC = () => {
    const context = useContext(jvxContext);

    useEffect(() => {
        browserHistory.push("/login")
        let startUpRequest = createStartupRequest();
        context.server.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
    })

    return (
        <Router history={browserHistory} >
            <Switch>
                <Route path={"/login"}>
                    <Login />
                </Route>
                <Route path={"/home/:componentId"}>
                    <Home />
                </Route>>
                <Redirect to={"/login"}/>
            </Switch>
      </Router>
  );
}
export default App;
