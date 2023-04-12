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

import React, { FC, useContext, useEffect, useMemo, useRef, useState, createContext } from "react"
import TopBar, { showTopBar, TopBarContext } from "./main/components/topbar/TopBar";
import { PopupContextProvider } from "./main/hooks/data-hooks/usePopupMenu";
import { useHistory } from "react-router-dom";
import COMPONENT_CLASSNAMES from "./main/components/COMPONENT_CLASSNAMES";
import { appContext } from "./main/contexts/AppProvider";
import { createCloseScreenRequest, createOpenScreenRequest } from "./main/factories/RequestFactory";
import REQUEST_KEYWORDS from "./main/request/REQUEST_KEYWORDS";
import { IPanel } from "./main/components/panels/panel/UIPanel";
import { SpeedDial } from "primereact/speeddial";
import { ReactUIDesigner } from "@sibvisions/reactui-designer";
import { isCorporation } from "./main/util/server-util/IsCorporation";
import useDesignerImages from "./main/hooks/style-hooks/useDesignerImages";
import { Tooltip } from "primereact/tooltip";
import BaseResponse from "./main/response/BaseResponse";
import RESPONSE_NAMES from "./main/response/RESPONSE_NAMES";
import DialogResponse from "./main/response/ui/DialogResponse";
import ErrorResponse from "./main/response/error/ErrorResponse";
interface IAppWrapper {
    embedOptions?: { [key: string]: any }
    theme?: string
    colorScheme?: string
    design?: string
}

interface IWSDesignerContext {
    isActive:boolean,
    toggleWSDesigner: () => void
}

export const WSDesignerContext = createContext<IWSDesignerContext>({ isActive: false, toggleWSDesigner: () => {} });

const AppWrapper: FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True, if the designer should be displayed */
    const [showDesignerView, setShowDesignerView] = useState<boolean>(sessionStorage.getItem("reactui-designer-on") === 'true');

    const [wsContextState, setWSContextState] = useState<IWSDesignerContext>({ isActive: false, toggleWSDesigner: () => setWSContextState(prevState => ({ ...prevState, isActive: !prevState.isActive })) });

    /** A function which is being passed to the designer, to rerender when the images have changed */
    const setImagesChanged = useDesignerImages();

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    const prevLocation = useRef<string>(history.location.pathname);

    /** When the designer-mode gets enabled/disabled, adjust the height and width of the application */
    useEffect(() => {
        const docStyle = window.getComputedStyle(document.documentElement)
        const mainHeight = docStyle.getPropertyValue('--main-height');
        const mainWidth = docStyle.getPropertyValue('--main-width');
        if (showDesignerView || wsContextState.isActive) {
            if (showDesignerView && !sessionStorage.getItem("reactui-designer-on")) {
                sessionStorage.setItem("reactui-designer-on", "true");
            }

            if (mainHeight === "100vh") {
                document.documentElement.style.setProperty("--main-height", 
                `calc(100vh - ${docStyle.getPropertyValue('--designer-topbar-height')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }

            if (mainWidth === "100vw") {
                document.documentElement.style.setProperty("--main-width", `calc(100vw - ${docStyle.getPropertyValue('--designer-panel-wrapper-width')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }
        }
        else {
            if (sessionStorage.getItem("reactui-designer-on")) {
                sessionStorage.removeItem("reactui-designer-on");
            }

            if (mainHeight !== "100vh") {
                document.documentElement.style.setProperty("--main-height", "100vh");
            }

            if (mainWidth !== "100vw") {
                document.documentElement.style.setProperty("--main-width", "100vw");
            }
        }
    }, [showDesignerView, wsContextState.isActive])

    /**
     * Subscribes to app-name, css-version and restart
     * @returns unsubscribes from app-name, css-version and restart
     */
    useEffect(() => {
        context.subscriptions.subscribeToTheme("appwrapper", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTheme("appwrapper");
        }
    }, [context.subscriptions]);

    // Open screens on refresh or on browser navigation forward and back buttons
    useEffect(() => {
        if (context.transferType !== "full") {
            history.listen(() => {
                if (history.action === "POP") {
                    // Checks if the response contains a dialog to save the screen when closing and keeps the url if there is a dialog.
                    const checkAskBefore = (prevPath: string, responses: BaseResponse[], comp?: IPanel) => {
                        let callCloseScreen = true;
                        responses.forEach(response => {
                            if (response.name === RESPONSE_NAMES.ERROR && (response as ErrorResponse).message === "Cancel closing") {
                                history.replace(prevPath);
                                callCloseScreen = false
                            }
                        });

                        if (callCloseScreen && comp) {
                            context.contentStore.closeScreen(comp.name, comp.screen_modal_ === true, context.appSettings.welcomeScreen.name ? true : false);
                        }
                    }

                    const pathName = history.location.pathname;
                    const navName = pathName.substring(pathName.indexOf("/home/") + "/home/".length);
                    if (navName) {
                        const navValue = context.contentStore.navigationNames.get(navName);
                        // If the same screen isn't already open or there are no screens open at all and there is a screen to open through pathname, open it.
                        if (navValue && navValue.componentId &&
                            ((context.contentStore.activeScreens[0] && context.contentStore.activeScreens[0].name !== navValue.screenId) || !context.contentStore.activeScreens.length)) {
                            let prevPathCopy = prevLocation.current
                            const openReq = createOpenScreenRequest();
                            openReq.componentId = navValue.componentId;
                            showTopBar(context.server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN), topbar)
                                .then((responses: BaseResponse[]) => {
                                    checkAskBefore(prevPathCopy, responses)
                                });
                        }
                        else {
                            const user = context.contentStore.currentUser;
                            if (!user.displayName) {
                                sessionStorage.clear();
                                window.location.reload();
                            }
                        }
                    }
                    else {
                        // If there is no screen to open because of the url and a screen is currently open, close it.
                        if (context.contentStore.activeScreens.length) {
                            context.contentStore.activeScreens.forEach(active => {
                                const comp = context.contentStore.getComponentByName(active.name) as IPanel;
                                if (comp && comp.className === COMPONENT_CLASSNAMES.PANEL) {
                                    let prevPathCopy = prevLocation.current
                                    const csRequest = createCloseScreenRequest();
                                    csRequest.componentId = comp.name;
                                    showTopBar(context.server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN), topbar)
                                        .then((responses: BaseResponse[]) => {
                                            checkAskBefore(prevPathCopy, responses, comp)
                                        });
                                }
                            })
                        }

                        // Open a welcome screen if available or route to home instead of displaying blank page
                        if (context.appSettings.welcomeScreen.name) {
                            showTopBar(context.api.sendOpenScreenRequest(context.appSettings.welcomeScreen.name), topbar)
                        }
                        else if (pathName === "/") {
                            history.replace("/home")
                        }
                    }
                }
                prevLocation.current = history.location.pathname;
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const getSpeedDialModel = () => {
        const speeddialModel = [];
        if (context.appSettings.showDesigner) {
            speeddialModel.push({
                label: 'Style-Designer',
                icon: 'fas fa-palette',
                command: () => setShowDesignerView(prevState => !prevState)
            });
        }
        return speeddialModel;
    }

    const speeddialModel = getSpeedDialModel();

    const content =
        <>
            <WSDesignerContext.Provider value={wsContextState}>
                {props.children}
                {(speeddialModel.length && !showDesignerView && !wsContextState.isActive) ? 
                    <>
                        <Tooltip target=".p-speeddial-linear .p-speeddial-action" position="left" />
                        <SpeedDial 
                            className="designer-button" 
                            model={speeddialModel} 
                            direction="up"
                            style={{
                                position: "absolute",
                                top: speeddialModel.length === 1 ? "calc(100% - 180px)" : "calc(100% - 220px)",
                                left: "calc(100% - 90px)",
                                opacity: "0.8",
                                fontSize: "1.825rem"
                            }} />
                    </>
                : undefined}
            </WSDesignerContext.Provider>
        </>

    return (
        <>
            <PopupContextProvider>
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
                        uploadCallback={(schemeFileName: string, themeFileName: string) => { }}
                        transferType={context.transferType} >
                        {content}

                    </ReactUIDesigner> :
                    <>
                        {content}
                    </>}
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper