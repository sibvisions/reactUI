/** React imports */
import React, { FC, useLayoutEffect } from "react";

/** 3rd Party imports */
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";

/** UI imports */
import UIManager from "./application-frame/UIManager";
import Login from "./application-frame/login/login";
import LoadingScreen from './application-frame/loading/loadingscreen';

/** Hook imports */
import { useStartup } from './main/components/zhooks';

/** Other imports */
import { ICustomContent } from "./MiddleMan";
import AppWrapper from "./AppWrapper";

/**
 * This component manages the start and routing of the application, if the application is started embedded.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUIEmbedded:FC<ICustomContent> = (props) => {
    const appReady = useStartup(props);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;

    useLayoutEffect(() => {
        if (props.style && props.style.height) {
            document.documentElement.style.setProperty("--main-height", props.style.height as string)
        }
    },[]);

    return (
        <AppWrapper embedOptions={props.embedOptions}>
            {appReady ?
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div className="embed-frame">
                        <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                        </Switch>
                    </div>
                </>
                :
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div className="embed-frame">
                        <LoadingScreen />
                    </div>
                </>}
        </AppWrapper>
    )
}
export default ReactUIEmbedded