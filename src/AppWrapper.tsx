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
import { createOpenScreenRequest } from "./main/factories/RequestFactory";
import REQUEST_KEYWORDS from "./main/request/REQUEST_KEYWORDS";
import { IPanel } from "./main/components/panels/panel/UIPanel";
import { SpeedDial } from "primereact/speeddial";
import { ReactUIDesigner } from "@sibvisions/reactui-designer";
import { VisionX } from "@sibvisions/visionx/dist/moduleindex";
import { isCorporation } from "./main/util/server-util/IsCorporation";
import useDesignerImages from "./main/hooks/style-hooks/useDesignerImages";
import { Tooltip } from "primereact/tooltip";
import { DesignerHelper } from "./main/DesignerHelper";
import ContentStore from "./main/contentstore/ContentStore";
interface IAppWrapper {
    embedOptions?: { [key: string]: any }
    theme?: string
    colorScheme?: string
    design?: string
}

interface IVisionXContext {
    toggleVisionX: () => void,
    designerHelper: DesignerHelper
}

export const WSDesignerContext = createContext<IVisionXContext>({ toggleVisionX: () => {}, designerHelper: new DesignerHelper(new ContentStore()) });

const AppWrapper: FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True if a screen was opened by clicking browser back or forward button (prevents openscreen loop) */
    const openedWithHistory = useRef<boolean>(false);

    /** True, if the designer should be displayed */
    const [showDesignerView, setShowDesignerView] = useState<boolean>(sessionStorage.getItem("reactui-designer-on") === 'true');

    const [showVisionX, setShowVisionX] = useState<boolean>(false);

    const [vxContextState, setVXContextState] = useState<IVisionXContext>({ toggleVisionX: () => setShowVisionX(prevState => !prevState), designerHelper: context.designerHelper });

    /** A function which is being passed to the designer, to rerender when the images have changed */
    const setImagesChanged = useDesignerImages();

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** When the designer-mode gets enabled/disabled, adjust the height and width of the application */
    useEffect(() => {
        const docStyle = window.getComputedStyle(document.documentElement)
        const mainHeight = docStyle.getPropertyValue('--main-height');
        const mainWidth = docStyle.getPropertyValue('--main-width');
        if (showDesignerView || showVisionX) {
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
    }, [showDesignerView, showVisionX])

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
                                        context.contentStore.closeScreen(comp.name, comp.screen_modal_ === true, context.appSettings.welcomeScreen.name ? true : false);
                                    }
                                })
                            }

                            if (context.appSettings.welcomeScreen.name) {
                                showTopBar(context.api.sendOpenScreenRequest(context.appSettings.welcomeScreen.name), topbar)
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

    const getSpeedDialModel = () => {
        const speeddialModel = [];
        if (context.appSettings.showDesigner) {
            speeddialModel.push({
                label: 'Style-Designer',
                icon: 'fas fa-palette',
                command: () => setShowDesignerView(prevState => !prevState)
            });
        }

        if (context.appSettings.showWSDesigner) {
            speeddialModel.push({
                label: 'Workscreen-Designer',
                icon: 'fas fa-hammer',
                command: () => vxContextState.toggleVisionX()
            })
        }
        return speeddialModel;
    }

    const speeddialModel = getSpeedDialModel();

    const content =
        <>
            <WSDesignerContext.Provider value={vxContextState}>
                {props.children}
                {(speeddialModel.length && !showDesignerView && !showVisionX) ? 
                    <>
                        <Tooltip target=".p-speeddial-linear .p-speeddial-action" position="left" />
                        <SpeedDial 
                            className="designer-button" 
                            model={speeddialModel} 
                            direction="up"
                            style={{
                                position: "absolute",
                                top: speeddialModel.length === 1 ? "calc(100% - 165px)" : "calc(100% - 220px)",
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
                    (showVisionX) ?
                        <VisionX mode="reactui" vxContext={vxContextState} >
                            {content}
                        </VisionX> :
                        <>
                            {content}
                        </>}
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper