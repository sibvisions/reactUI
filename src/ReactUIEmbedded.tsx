/** React imports */
import React, { FC, useLayoutEffect } from "react";

/** 3rd Party imports */
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";

/** UI imports */
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import LoadingScreen from './frontmask/loading/loadingscreen';
//import Settings from "./frontmask/settings/Settings"

/** Hook imports */
import { useStartup } from './main/components/zhooks';

/** Other imports */
import { ICustomContent } from "./MiddleMan";
import AppWrapper from "./AppWrapper";

const ReactUIEmbedded:FC<ICustomContent> = (props) => {
    const [startupDone, appReady, appName] = useStartup(props);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;

    useLayoutEffect(() => {
        if (props.style && props.style.height) {
            document.documentElement.style.setProperty("--mainHeight", props.style.height as string)
        }
    },[]);

    return (
        <AppWrapper appName={appName}>
            {appReady && startupDone ?
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div style={{ border: "12px solid #2196F3", borderRadius: "5%" }}>
                        <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                            {/* <Route exact path={"/settings"} render={() => <Settings />}/> */}
                            <Route path={"/home"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                        </Switch>
                    </div>
                </>
                :
                <LoadingScreen />}
        </AppWrapper>
    )
}
export default ReactUIEmbedded