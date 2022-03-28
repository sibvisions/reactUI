/** React imports */
import React, { FC, useContext, useLayoutEffect } from 'react';

/** 3rd Party imports */
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";

/** UI imports */
import UIManager from './frontmask/UIManager';
import Login from "./frontmask/login/login";
import LoadingScreen from './frontmask/loading/loadingscreen';
//import Settings from "./frontmask/settings/Settings"

/** Hook imports */
import { useStartup } from './main/components/zhooks';

/** Other imports */
import { ICustomContent } from "./MiddleMan";
import AppWrapper from './AppWrapper';
import UIManagerV2 from './frontmask/UIManagerV2';
import { appContext } from './main/AppProvider';
import Server from './main/Server';


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
    return (
        <AppWrapper>
            {appReady ?
                <>
                    <Switch>
                        {context.appSettings.version !== 2 && <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />}
                        {context.appSettings.version !== 2 && <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />}
                        {context.appSettings.version === 2 && <Route path={""} render={() => <UIManagerV2 />} />}
                    </Switch>
                </>
                :
                <LoadingScreen />
            }
        </AppWrapper>
    );
}
export default ReactUI;
