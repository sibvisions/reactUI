/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { CSSProperties, FC, useContext, useEffect, useLayoutEffect, useState } from 'react';
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";
import UIManager from './application-frame/screen-management/ui-manager/UIManager';
import LoadingScreen from './application-frame/loading/Loadingscreen';
import type { ICustomContent } from "./MiddleMan";
import AppWrapper from './AppWrapper';
import UIManagerFull from './application-frame/screen-management/ui-manager/UIManagerFull';
import { appContext } from './main/contexts/AppProvider';
import Login from './application-frame/login/Login';
import {ErrorBoundary} from 'react-error-boundary'
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import tinycolor from 'tinycolor2';
import { addCSSDynamically } from './main/util/html-util/AddCSSDynamically';

const ErrorFallback: FC<{ error: Error, resetErrorBoundary: (...args: Array<unknown>) => void }> = ({ error, resetErrorBoundary }) => {
    const [showDetails, setShowDetails] = useState<boolean>();

    return (
        <div className='crash-main'>
            <div className='crash-banner'>
                <div className='crash-wrapper'>
                    <div>
                        <i className='crash-message-icon pi pi-times-circle' />
                        <span className='crash-message-text'>Unexpected Error!</span>
                    </div>
                    
                    {showDetails && 
                        <div className={'crash-input-stack ' + (showDetails ? 'show-crash-details' : '')}  style={{ transition: "max-height 1s ease-out" }}>
                            <InputTextarea
                                className='crash-input-stack-textarea rc-input'
                                value={error.stack}
                                style={{ resize: 'none' }}
                                readOnly />
                        </div>}
                    <div className='crash-button-wrapper'>
                        <Button 
                            className='rc-button' 
                            style={{ 
                                "--background": window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                                "--hoverBackground": tinycolor(window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color')).darken(5).toString()
                            } as CSSProperties} 
                            label="Details" 
                            onClick={() => setShowDetails(prevState => !prevState)} />
                        <Button 
                            style={{ 
                                marginLeft: "0.5rem",
                                "--background": window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                                "--hoverBackground": tinycolor(window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color')).darken(5).toString()
                            } as CSSProperties} 
                            label="Restart" 
                            onClick={resetErrorBoundary} />
                    </div>
                </div>
            </div>

        </div>
    )
}


/**
 * This component manages the start and routing of the application.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUI: FC<ICustomContent> = (props) => {
    const context = useContext(appContext);
    
    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;

    /** The state of the css-version */
    const [appCssVersion, setCssVersions] = useState<string>("");

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    /** Adds the application.css to the head */
    useLayoutEffect(() => {
        let path = 'application.css'
        if (appCssVersion) {
            path = path + "?version=" + appCssVersion;
        }
        addCSSDynamically(path, "applicationCSS", () => context.appSettings.setAppReadyParam("applicationCSS"));
    }, [appCssVersion, restart, context.appSettings]);

    /**
     * Subscribes to app-name, css-version and restart
     * @returns unsubscribes from app-name, css-version and restart
     */
    useEffect(() => {
        context.subscriptions.subscribeToAppCssVersion((version: string) => setCssVersions(version));
        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState))

        return () => {
            context.subscriptions.unsubscribeFromAppCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    }, [context.subscriptions]);
  
    /** When the app isn't ready, show the loadingscreen, if it is show normal */
    if (context.transferType === "full") {
        return (
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => context.subscriptions.emitRestart()}>
                {context.appReady ?
                    <AppWrapper>

                        <Switch>
                            <Route path={""} render={() => <UIManagerFull />} />
                        </Switch>

                    </AppWrapper>
                    :
                    <LoadingScreen />
                }
            </ErrorBoundary>

        )
    }
    else {
        return (
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => context.subscriptions.emitRestart()}>
                {context.appReady ?
                    <AppWrapper>

                        <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                        </Switch>

                    </AppWrapper>
                    :
                    <LoadingScreen />
                }
            </ErrorBoundary>

        );
    }
}
export default ReactUI;
