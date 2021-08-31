/** React imports */
import React, { Children, createContext, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import * as _ from 'underscore'

/** UI imports */
import Menu from "./menu/menu";

/** Hook imports */
import { useEventHandler, useMenuCollapser, useResponsiveBreakpoints } from "../main/components/zhooks";

/** Other imports */
import { ChildWithProps, concatClassnames, getScreenIdFromNavigation } from "../main/components/util";
import { REQUEST_ENDPOINTS } from "../main/request";
import { createDeviceStatusRequest } from "../main/factories/RequestFactory";
import { appContext } from "../main/AppProvider";
import { LayoutContext } from "../main/LayoutContext";
import ScreenManager from "./ScreenManager";
import ChangePasswordDialog from "./changePassword/ChangePasswordDialog";
import CorporateMenu from "./menu/corporateMenu";
import { MenuVisibility } from "../main/AppSettings";
import { ApplicationSettingsResponse } from "../main/response";
import useResizeHandler from "../main/components/zhooks/useResizeHandler";
import { useParams } from "react-router";

export interface IUIManagerProps {
    screenId: string
    customAppWrapper?: React.ComponentType
}

export interface IResizeContext {
    menuSize?:number,
    menuRef?: any,
    login?:boolean,
    style?: CSSProperties
}

export const ResizeContext = createContext<IResizeContext>({});

/**
 * Main displaying component which holds the menu and the main screen element, manages resizing for layout recalculating
 * @param props - the children components
 */
const UIManager: FC<IUIManagerProps> = (props) => {
    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);

    /** Reference for the menu component */
    const menuRef = useRef<any>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('reactUI');

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    const menuMini = false;

    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout, [context.appSettings.applicationMetaData]);

    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();

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
    getMenuSizeArray(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menuWidth')),
    menuMini ? parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menuCollapsedWidth')) : 0), menuCollapsed);

    const componentSize = useResizeHandler(sizeRef, props.children, menuSize, menuRef)

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) =>
            setMenuVisibility({
                menuBar: appSettings.menuBar,
                toolBar: appSettings.toolBar
            }));

        return () => context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => setMenuVisibility({
            menuBar: appSettings.menuBar,
            toolBar: appSettings.toolBar
        }));
    }, [context.subscriptions])

    /** At the first render or when a screen is changing, call notifyScreenNameChanged, that screenName gets updated */
    useEffect(() => {
        let screenTitle = context.server.APP_NAME;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })      
        context.subscriptions.notifyScreenNameChanged(screenTitle)
    }, [props.children, context.server.APP_NAME, context.subscriptions]);

    const CustomWrapper = props.customAppWrapper;

    return (
        (CustomWrapper) ?
            <div
                className={concatClassnames(
                    "reactUI",
                    appLayout === "corporation" ? "corporation" : ""
                )}>
                <ChangePasswordDialog username={context.contentStore.currentUser.name} loggedIn={true} />
                <CustomWrapper>
                    <LayoutContext.Provider value={componentSize}>
                        <div id="reactUI-main" className="main">
                            <ScreenManager />
                        </div>
                    </LayoutContext.Provider>
                </CustomWrapper>
            </div>
            : <div className={concatClassnames("reactUI", appLayout === "corporation" ? "corporation" : "")}>
                <ChangePasswordDialog username={context.contentStore.currentUser.userName} loggedIn={true} />
                {appLayout === "corporation" ? <CorporateMenu /> : <Menu forwardedRef={menuRef} showMenuMini={menuMini} />}
                {/* <LayoutContext.Provider value={componentSize}> */}
                    <div id="reactUI-main" className={concatClassnames(
                        "main",
                        appLayout === "corporation" ? "main--with-c-menu" : "main--with-s-menu",
                        ((menuCollapsed || (window.innerWidth <= 600 && context.appSettings.menuOverlaying)) && (appLayout === "standard" || appLayout === undefined)) ? " screen-expanded" : "",
                        menuMini ? "" : "screen-no-mini",
                        menuVisibility.toolBar ? "toolbar-visible" : "",
                        !getScreenIdFromNavigation(componentId, context.contentStore) && context.appSettings.desktopPanel ? "desktop-panel-enabled" : ""
                    )}>
                        <ResizeContext.Provider value={{login: false, menuRef: menuRef, menuSize: menuSize}}>
                            <ScreenManager />
                        </ResizeContext.Provider>
                        
                    </div>
                {/* </LayoutContext.Provider> */}
            </div>
    )
}
export default UIManager