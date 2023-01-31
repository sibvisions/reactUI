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

import React, { CSSProperties, FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { ReactUIDesigner } from "@sibvisions/reactui-designer";
import { isCorporation } from "./main/util/server-util/IsCorporation";
import useDesignerImages from "./main/hooks/style-hooks/useDesignerImages";
interface IAppWrapper {
    embedOptions?: { [key: string]: any }
    theme?: string
    colorScheme?: string
    design?: string
}

const AppWrapper: FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** If the confirm-dialog is visible and the message-properties */
    const [messageVisible, messageProps] = useConfirmDialogProps();

    /** The state of the tab-title */
    const [tabTitle, setTabTitle] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** The state of the css-version */
    const [appCssVersion, setCssVersions] = useState<string>("");

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True if a screen was opened by clicking browser back or forward button (prevents openscreen loop) */
    const openedWithHistory = useRef<boolean>(false);

    /** True, if the designer should be displayed */
    const [showDesignerView, setShowDesignerView] = useState<boolean>(false);

    /** A function which is being passed to the designer, to rerender when the images have changed */
    const setImagesChanged = useDesignerImages();

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** Adds the application.css to the head */
    useLayoutEffect(() => {
        let path = 'application.css'
        if (appCssVersion) {
            path = path + "?version=" + appCssVersion;
        }
        addCSSDynamically(path, "applicationCSS", () => context.appSettings.setAppReadyParam("applicationCSS"));
    }, [appCssVersion, restart, context.appSettings]);

    /** When the designer-mode gets enabled/disabled, adjust the height and width of the application */
    useEffect(() => {
        const docStyle = window.getComputedStyle(document.documentElement)
        const mainHeight = docStyle.getPropertyValue('--main-height');
        const mainWidth = docStyle.getPropertyValue('--main-width');
        if (showDesignerView) {
            if (mainHeight === "100vh") {
                document.documentElement.style.setProperty("--main-height", 
                `calc(100vh - ${docStyle.getPropertyValue('--designer-topbar-height')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }

            if (mainWidth === "100vw") {
                document.documentElement.style.setProperty("--main-width", `calc(100vw - ${docStyle.getPropertyValue('--designer-panel-wrapper-width')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }
        }
        else {
            if (mainHeight !== "100vh") {
                document.documentElement.style.setProperty("--main-height", "100vh");
            }

            if (mainWidth !== "100vw") {
                document.documentElement.style.setProperty("--main-width", "100vw");
            }
        }
    }, [showDesignerView])

    /**
     * Subscribes to app-name, css-version and restart
     * @returns unsubscribes from app-name, css-version and restart
     */
    useEffect(() => {
        context.subscriptions.subscribeToTabTitle((newTabTitle: string) => setTabTitle(newTabTitle));

        context.subscriptions.subscribeToAppCssVersion((version: string) => setCssVersions(version));

        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState))

        context.subscriptions.subscribeToTheme("appwrapper", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTabTitle((newTabTitle: string) => setTabTitle(newTabTitle));
            context.subscriptions.unsubscribeFromAppCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
            context.subscriptions.unsubscribeFromTheme("appwrapper");
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

    const content =
        <>
            {props.children}
            {context.appSettings.showDesigner && !showDesignerView &&
                <Button
                    className="p-button-raised p-button-rounded rc-button designer-button"
                    icon="fas fa-palette"
                    style={{
                        "--background": "#2196F3",
                        "--hoverBackground": tinycolor("#2196F3").darken(5).toString(),
                        width: "4rem",
                        height: "4rem",
                        position: "absolute",
                        top: "calc(100% - 100px)",
                        left: "calc(100% - 90px)",
                        opacity: "0.8",
                        fontSize: "1.825rem"
                    } as CSSProperties}
                    onClick={() => setShowDesignerView(prevState => !prevState)} />}
        </>

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
                    {showDesignerView ?
                        <ReactUIDesigner
                            isLogin={false}
                            changeImages={() => setImagesChanged(prevState => !prevState)}
                            uploadUrl={context.server.designerUrl}
                            isCorporation={isCorporation(appLayout, appTheme)}
                            logoLogin={process.env.PUBLIC_URL + context.appSettings.LOGO_LOGIN}
                            logoBig={process.env.PUBLIC_URL + context.appSettings.LOGO_BIG}
                            logoSmall={process.env.PUBLIC_URL + context.appSettings.LOGO_SMALL}
                            designerSubscription={context.designerSubscriptions}
                            appName={context.appSettings.applicationMetaData.applicationName}
                            setShowDesigner={() => setShowDesignerView(prevState => !prevState)}
                            changeTheme={(newTheme: string) => context.subscriptions.emitThemeChanged(newTheme)}
                            uploadCallback={(schemeFileName: string, themeFileName: string) => {}}
                            transferType={context.transferType} >
                            {content}

                        </ReactUIDesigner> :
                        <>
                            {content}
                        </>}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper