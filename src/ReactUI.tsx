/** React imports */
import React, { FC, useContext, useLayoutEffect } from 'react';

/** 3rd Party imports */
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";

/** UI imports */
import UIManager from './application-frame/screen-management/ui-manager/UIManager';
import Login from "./application-frame/login/login";
import LoadingScreen from './application-frame/loading/loadingscreen';

/** Hook imports */
import { useStartup } from './main/hooks';

/** Other imports */
import { ICustomContent } from "./MiddleMan";
import AppWrapper from './AppWrapper';
import UIManagerV2 from './application-frame/screen-management/ui-manager/UIManagerV2';
import { appContext } from './main/AppProvider';


/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUI: FC<ICustomContent> = (props) => {
    const context = useContext(appContext);

    const appReady = useStartup(props);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;
    
    /** When the app isn't ready, show the loadingscreen, if it is show normal */
    if (context.appSettings.version === 2) {
        return (
            <AppWrapper>
                {appReady ?
                    <Switch>
                        <Route path={""} render={() => <UIManagerV2 />} />
                    </Switch>
                    :
                    <LoadingScreen />
                }
            </AppWrapper>
        )
    }
    else {
        return (
            <AppWrapper>
                {appReady ?
                    <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                    </Switch>
                    :
                    <LoadingScreen />
                }
            </AppWrapper>
        );
    }

}
export default ReactUI;
