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

import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";
import UIManager from "./application-frame/screen-management/ui-manager/UIManager";
import LoadingScreen from './application-frame/loading/Loadingscreen';
import { ICustomContent } from "./MiddleMan";
import AppWrapper from "./AppWrapper";
import { appContext } from "./main/contexts/AppProvider";
import Login from "./application-frame/login/Login";
import { addCSSDynamically } from "./main/util/html-util/AddCSSDynamically";
import { Helmet } from "react-helmet";
import ErrorDialog from "./application-frame/error-dialog/ErrorDialog";
import UIToast from "./main/components/toast/UIToast";
import { ConfirmDialog } from "primereact/confirmdialog";
import ErrorBar from "./application-frame/error-bar/ErrorBar";

/**
 * This component manages the start and routing of the application, if the application is started embedded.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUIEmbedded:FC<ICustomContent> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;

    /** The state of the css-version */
    const [appCssVersion, setCssVersions] = useState<string>("");

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    /** The state of the tab-title */
    const [tabTitle, setTabTitle] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** A flag to rerender when messages should be displayed */
    const [messageFlag, setMessageFlag] = useState<boolean>(true);

    /** Adds the application.css to the head */
    useLayoutEffect(() => {
        let path = 'application.css'
        if (appCssVersion) {
            path = path + "?version=" + appCssVersion;
        }
        addCSSDynamically(path, "applicationCSS", () => context.appSettings.setAppReadyParam("applicationCSS"));
    }, [appCssVersion, restart, context.appSettings]);

    /**
     * Subscribes to messages, css-version and restart
     * @returns unsubscribes from app-name, css-version and restart
     */
    useEffect(() => {
        context.subscriptions.subscribeToAppCssVersion((version: string) => setCssVersions(version));
        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));
        context.subscriptions.subscribeToMessageDialogProps(() => setMessageFlag(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromAppCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
            context.subscriptions.unsubscribeFromMessageDialogProps();
        }
    }, [context.subscriptions]);

    useLayoutEffect(() => {
        if (props.style && props.style.height) {
            document.documentElement.style.setProperty("--main-height", props.style.height as string)
        }
    },[props.style]);
    
    useEffect(() => {
        if (props.embedOptions && props.embedOptions.showMenu) {
            const elem = document.getElementsByClassName("embed-frame-no-border")[0];
            const mainHeight = window.getComputedStyle(document.documentElement).getPropertyValue('--main-height');
            const mainWidth = window.getComputedStyle(document.documentElement).getPropertyValue('--main-width');
            if (elem) {
                if (mainHeight && window.getComputedStyle(elem).height && window.getComputedStyle(elem).height !== mainHeight) {
                    document.documentElement.style.setProperty("--main-height", window.getComputedStyle(elem).height);
                }

                if (mainWidth && window.getComputedStyle(elem).width && window.getComputedStyle(elem).width !== mainWidth) {
                    document.documentElement.style.setProperty("--main-width", window.getComputedStyle(elem).width);
                }
            }
        }
    });

    const messages = useMemo(() => {
        if (context.transferType !== "full") {
            return context.contentStore.openMessages.map(message => message.fn.apply(undefined, []));
        }
        return undefined;
    }, [messageFlag]);

    return (
        <>
            <Helmet>
                <title>{tabTitle ? tabTitle : "..."}</title>
            </Helmet>
            <ErrorDialog />
            <UIToast />
            {messages}
            <ErrorBar />
            {context.appReady ?
                <AppWrapper embedOptions={props.embedOptions}>

                    <>
                        {props.embedOptions && !props.embedOptions.showMenu && <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                            ReactUI Embedded WorkScreen
                        </span>}
                        <div className={props.embedOptions?.showMenu ? "embed-frame-no-border" : "embed-frame"}>
                            <Switch>
                                <Route exact path={"/login"} render={() => <Login />} />
                                <Route exact path={"/screens/:screenName"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                                <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            </Switch>
                        </div>
                    </>

                </AppWrapper>
                :
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div className="embed-frame">
                        <LoadingScreen />
                    </div>
                </>}
        </>

    )
}
export default ReactUIEmbedded