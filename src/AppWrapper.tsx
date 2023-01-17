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

import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Helmet } from "react-helmet";
import TopBar, { showTopBar, TopBarContext } from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { ConfirmDialog } from "primereact/confirmdialog";
import { PopupContextProvider } from "./main/hooks/data-hooks/usePopupMenu";
import ErrorBar from "./application-frame/error-bar/ErrorBar";
import { useHistory } from "react-router-dom";
import COMPONENT_CLASSNAMES from "./main/components/COMPONENT_CLASSNAMES";
import { appContext } from "./main/contexts/AppProvider";
import ErrorDialog from "./application-frame/error-dialog/ErrorDialog";
import { createOpenScreenRequest } from "./main/factories/RequestFactory";
import useConfirmDialogProps from "./main/hooks/components-hooks/useConfirmDialogProps";
import { addCSSDynamically } from "./main/util/html-util/AddCSSDynamically";
import REQUEST_KEYWORDS from "./main/request/REQUEST_KEYWORDS";
import { IPanel } from "./main/components/panels/panel/UIPanel";
interface IAppWrapper {
    embedOptions?: { [key:string]:any }
    theme?:string
    colorScheme?:string
    design?:string
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** If the confirm-dialog is visible and the message-properties */
    const [messageVisible, messageProps] = useConfirmDialogProps();

    /** The state of the tab-title */
    const [tabTitle, setTabTitle] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** The state of the css-version */
    const [cssVersions, setCssVersions] = useState<{ appCssVersion: string, scheme: { name: string, version: string } , theme: { name: string, version: string } }>({ appCssVersion: "", scheme: {name: "", version: ""}, theme: {name: "", version: ""} });

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True if a screen was opened by clicking browser back or forward button (prevents openscreen loop) */
    const openedWithHistory = useRef<boolean>(false);

    /** Adds the application.css to the head */
    useLayoutEffect(() => {
        let path = 'application.css'
        if (cssVersions.appCssVersion) {
            path = path + "?version=" + cssVersions.appCssVersion;
        }
        addCSSDynamically(path, "applicationCSS", () => context.appSettings.setAppReadyParam("applicationCSS"));
    }, [cssVersions.appCssVersion, restart, context.appSettings]);

    /** Adds the application.css to the head */
    useLayoutEffect(() => {
        if (cssVersions.scheme.name && cssVersions.scheme.version) {
            let path = "color-schemes/" + cssVersions.scheme.name
            //path = path + "?version=" + cssVersions.scheme.version;
            addCSSDynamically(path, "schemeCSS", () => context.appSettings.setAppReadyParam("schemeCSS"));
        }

        if (cssVersions.theme.name && cssVersions.theme.version) {
            let path = "themes/" + cssVersions.theme.name
            //path = path + "?version=" + cssVersions.theme.version;
            addCSSDynamically(path, "themeCSS", () => context.appSettings.setAppReadyParam("themeCSS"));
        }
    }, [cssVersions.scheme, cssVersions.theme]);

    /**
     * Subscribes to app-name, css-version and restart
     * @returns unsubscribes from app-name, css-version and restart
     */
    useEffect(() => {
        context.subscriptions.subscribeToTabTitle((newTabTitle: string) => setTabTitle(newTabTitle));

        context.subscriptions.subscribeToAppCssVersion((version: string) => setCssVersions(prevState => ({...prevState, appCssVersion: version})));

        context.subscriptions.subscribeToDesignerCssVersion((scheme:{ name: string, version: string }, theme: { name: string, version: string }) => setCssVersions(prevState => ({...prevState, scheme: scheme, theme: theme})));

        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState))

        return () => {
            context.subscriptions.unsubscribeFromTabTitle((newTabTitle: string) => setTabTitle(newTabTitle));
            context.subscriptions.unsubscribeFromAppCssVersion();
            context.subscriptions.unsubscribeFromDesignerCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    }, [context.subscriptions]);

    // Open screens on refresh or on browser navigation forward and back buttons
    useEffect(() => {
        if (context.transferType !== "full") {
            history.listen(() => {
                if (history.action === "POP") {
                    let currentlyOpening = false;
                    if (!openedWithHistory.current) {
                        const pathName = history.location.pathname;
                        const navName = pathName.substring(pathName.indexOf("/home/") + "/home/".length);
                        if (navName) {
                            const navValue = context.contentStore.navigationNames.get(navName);
                            if (navValue && navValue.componentId && context.contentStore.activeScreens && context.contentStore.activeScreens[0].name !== navValue.screenId) {
                                const openReq = createOpenScreenRequest();
                                openReq.componentId = navValue.componentId;
                                showTopBar(context.server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN), topbar);

                                currentlyOpening = true;
                                openedWithHistory.current = true;
                            }
                        }
                        else {
                            if (context.contentStore.activeScreens.length) {
                                context.contentStore.activeScreens.forEach(active => {
                                    const comp = context.contentStore.getComponentByName(active.name) as IPanel;
                                    if (comp && comp.className === COMPONENT_CLASSNAMES.PANEL) {
                                        context.contentStore.closeScreen(comp.name, comp.screen_modal_ === true);
                                    }

                                })
                            }
                        }
                    }

                    if (!currentlyOpening) {
                        openedWithHistory.current = false;
                    }
                }
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Helmet>
                <title>{tabTitle ? tabTitle : "<App-Name>"}</title>
            </Helmet>
            <ErrorDialog />
            <UIToast />
            <ConfirmDialog visible={messageVisible} {...messageProps} />
            <ErrorBar />
            <PopupContextProvider>
                <TopBar>
                    {props.children}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper