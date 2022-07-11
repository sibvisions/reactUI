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

import React, { Children, FC, useContext, useEffect, useMemo, useRef, useState } from "react";
import Menu from "../../menu/Menu";
import { appContext } from "../../../main/contexts/AppProvider";
import ScreenManager from "../ScreenManager";
import ChangePasswordDialog from "../../change-password/ChangePasswordDialog";
import CorporateMenu from "../../menu/CorporateMenu";
import { MenuOptions, VisibleButtons } from "../../../main/AppSettings";
import { useParams } from "react-router";
import ContentStore from "../../../main/contentstore/ContentStore";
import { isCorporation } from "../../../main/util/server-util/IsCorporation";
import ResizeProvider from "../../../main/contexts/ResizeProvider";
import useMenuCollapser from "../../../main/hooks/event-hooks/useMenuCollapser";
import useDeviceStatus from "../../../main/hooks/event-hooks/useDeviceStatus";
import useResponsiveBreakpoints from "../../../main/hooks/event-hooks/useResponsiveBreakpoints";
import ChildWithProps from "../../../main/util/types/ChildWithProps";
import { concatClassnames } from "../../../main/util/string-util/ConcatClassnames";
import { getScreenIdFromNavigation } from "../../../main/util/component-util/GetScreenNameFromNavigation";

// Interface for UIManager
export interface IUIManagerProps {
    customAppWrapper?: React.ComponentType,
}

/**
 * Main displaying component which holds the menu and the main screen element, manages resizing for layout recalculating
 * @param props - the children components
 */
const UIManager: FC<IUIManagerProps> = (props) => {
    /** Reference for the menu component */
    const menuRef = useRef<any>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('reactUI');

    /** State of menu-visibility */
    const [menuOptions, setMenuOptions] = useState<MenuOptions>(context.appSettings.menuOptions);

    /** True, if the standard menu for mobile is active IF corporation applayout is set */
    const [mobileStandard, setMobileStandard] = useState<boolean>(false);

    /** True, if the menu should be shown in mini mode */
    const menuMini = false;

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /**
     * Helper function for responsiveBreakpoints hook for menu-size breakpoint values
     * @param start - Biggest possible size of menu
     * @param end - Smallest possible size of menu
     * @returns an Array with 10 step values between start and end
     */
    const getMenuSizeArray = (start:number, end:number) => {
        const dataArray:number[] = []
        while (start >= end) {
            dataArray.push(start);
            start -= 10;
        }
        return dataArray;
    }

    /** Current state of menu size */
    const menuSize = useResponsiveBreakpoints(menuRef, 
    getMenuSizeArray(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--std-menu-width')),
    menuMini ? parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--std-menu-collapsed-width')) : 0), menuCollapsed);

    // Subscribes to the menu-visibility and theme
    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuOptions:MenuOptions) => setMenuOptions(menuOptions));
        context.subscriptions.subscribeToTheme("uimanager", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((menuOptions:MenuOptions) => setMenuOptions(menuOptions));
            context.subscriptions.unsubscribeFromTheme("uimanager");
        }
    }, [context.subscriptions])

    /** At the first render or when a screen is changing, call notifyScreenNameChanged, that screenName gets updated */
    useEffect(() => {
        let screenTitle = context.appSettings.applicationMetaData.applicationName;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })      
        context.subscriptions.notifyScreenTitleChanged(screenTitle)
    }, [props.children, context.subscriptions]);

    const CustomWrapper = props.customAppWrapper;

    return (
        (CustomWrapper) ?
            <div
                className={concatClassnames(
                    "reactUI",
                    isCorporation(appLayout, appTheme) ? "corporation" : "",
                    appTheme
                )}>
                <ChangePasswordDialog loggedIn username={(context.contentStore as ContentStore).currentUser.name} password="" />
                <CustomWrapper>
                    <div id="reactUI-main" className="main">
                        <ResizeProvider login={false} menuRef={menuRef} menuSize={menuSize}>
                            <ScreenManager />
                        </ResizeProvider>
                    </div>
                </CustomWrapper>
            </div>
            : <div className={concatClassnames(
                "reactUI",
                isCorporation(appLayout, appTheme) ? "corporation" : "",
                appTheme
            )} >
                <ChangePasswordDialog loggedIn username={(context.contentStore as ContentStore).currentUser.userName} password="" />
                {isCorporation(appLayout, appTheme) ?
                    <CorporateMenu
                        menuOptions={menuOptions} />
                    :
                    <Menu
                        forwardedRef={menuRef}
                        showMenuMini={menuMini}
                        menuOptions={menuOptions} />}
                <div id="reactUI-main" className={concatClassnames(
                    "main",
                    isCorporation(appLayout, appTheme) ? "main--with-corp-menu" : "main--with-s-menu",
                    ((menuCollapsed || (["Small", "Mini"].indexOf(deviceStatus) !== -1 && context.appSettings.menuOverlaying)) && (appLayout === "standard" || appLayout === undefined || (appLayout === "corporation" && window.innerWidth <= 530))) ? " screen-expanded" : "",
                    menuMini ? "" : "screen-no-mini",
                    menuOptions.toolBar ? "toolbar-visible" : "",
                    !menuOptions.menuBar ? "menu-not-visible" : "",
                    !getScreenIdFromNavigation(componentId, context.contentStore) && context.appSettings.desktopPanel ? "desktop-panel-enabled" : "",
                )}>
                    <ResizeProvider login={false} menuRef={menuRef} menuSize={menuSize} menuCollapsed={menuCollapsed} mobileStandard={mobileStandard} setMobileStandard={(active:boolean) => setMobileStandard(active)}>
                        <ScreenManager />
                    </ResizeProvider>
                </div>
            </div>
    )
}
export default UIManager