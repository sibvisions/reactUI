/** React imports */
import React, { FC } from 'react';

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
import AppWrapper from './AppWrapper';

/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUI: FC<ICustomContent> = (props) => {
    const [startupDone, appReady, appName] = useStartup(props);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;
    
    /** When the app isn't ready, show the loadingscreen, if it is show normal */
    return (
        <AppWrapper appName={appName}>
            {appReady && startupDone ?
                <>
                    <Switch>
                        <Route exact path={"/login"} render={() => <Login />} />
                        <Route exact path={"/home/:componentId"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                        {/* <Route exact path={"/settings"} render={() => <Settings />}/> */}
                        <Route path={"/home"} render={() => <Home customAppWrapper={props.customAppWrapper} />} />
                    </Switch>
                </>
                :
                <LoadingScreen />
            }
        </AppWrapper>
    );
}
export default ReactUI;
