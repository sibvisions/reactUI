/** React imports */
import React, { Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import * as _ from 'underscore'

/** UI imports */
import Menu from "./menu/menu";

/** Hook imports */
import { useEventHandler, useMenuCollapser, useResponsiveBreakpoints } from "../main/components/zhooks";

/** Other imports */
import { ChildWithProps, concatClassnames } from "../main/components/util";
import { REQUEST_ENDPOINTS } from "../main/request";
import { createDeviceStatusRequest } from "../main/factories/RequestFactory";
import { appContext } from "../main/AppProvider";
import { LayoutContext } from "../main/LayoutContext";
import ScreenManager from "./ScreenManager";
import ChangePasswordDialog from "./changePassword/ChangePasswordDialog";
import CorporateMenu from "./menu/corporateMenu";
import { MenuVisibility } from "../main/AppSettings";
import { ApplicationSettingsResponse } from "../main/response";

export interface IUIManagerProps {
    screenId: string
    customAppWrapper?: React.ComponentType
}

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

    /** Current state of the size of the screen-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    const menuMini = false;

    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout, [context.appSettings.applicationMetaData])

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

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
    const doResize = useCallback(() => {
        if(sizeRef.current || document.querySelector('#workscreen')){
            const width = sizeRef.current ? sizeRef.current.offsetWidth : (document.querySelector('#workscreen') as HTMLElement)!.offsetWidth;
            const height = sizeRef.current ? sizeRef.current.offsetHeight : (document.querySelector('#workscreen') as HTMLElement)!.offsetHeight;
            //const size = sizeRef.current ? sizeRef.current.getBoundingClientRect() : document.querySelector('#workscreen')!.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: width, height: height});
            });

            //TODO: maybe fetch ids via screenId instead of relying on the children 
            setComponentSize(sizeMap);
        }
    },[props.children])

    /** Using underscore throttle for throttling resize event */
    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    /** Using underscore debounce to debounce sending the current devicestatus (screen-container height and width) to the server */
    const handleDeviceStatus = _.debounce(() => {
        const deviceStatusReq = createDeviceStatusRequest();
        if(sizeRef.current || document.querySelector('#workscreen')){
            const mainSize = sizeRef.current ? sizeRef.current.getBoundingClientRect() : document.querySelector('#workscreen')!.getBoundingClientRect();
            deviceStatusReq.screenHeight = mainSize.height;
            deviceStatusReq.screenWidth = mainSize.width;
            context.server.sendRequest(deviceStatusReq, REQUEST_ENDPOINTS.DEVICE_STATUS);
        }
    },150);

    /** Resizing when screens or menuSize changes, menuSize changes every 10 pixel resizing every 10 pixel for a smooth transition */
    useLayoutEffect(() => {
        handleResize();
    }, [props.children, handleResize, menuSize])

    /** 
     * Resize event handling, resize measuring and adding disable overflow while resizing to disable flickering scrollbar 
     * @returns remove eventListeners
     */
    useEffect(() => {
        const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
        const resizeTimer = _.debounce(() => {
            if (currSizeRef)
                currSizeRef.classList.remove("transition-disable-overflow")
        },150);
        const resizeListenerCall = () => {
            if (currSizeRef)
                currSizeRef.classList.add("transition-disable-overflow");
            handleResize();
            resizeTimer();
        }
        window.addEventListener("resize", resizeListenerCall)
        window.addEventListener("resize", handleDeviceStatus);

        return () => {
            window.removeEventListener("resize", handleDeviceStatus);
            window.removeEventListener("resize", resizeListenerCall);

        }
    // eslint-disable-next-line
    },[doResize]);

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

    useEventHandler(menuRef.current ? menuRef.current : undefined, 'transitionstart', (event:any) => {
        if (event.propertyName === "width" && event.srcElement === document.getElementsByClassName('menu-panelmenu-wrapper')[0]) {
            const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
            currSizeRef.classList.add('transition-disable-overflow');
        }
    })

    useEventHandler(menuRef.current ? menuRef.current : undefined, 'transitionend', (event:any) => {
        if (event.propertyName === "width" && event.srcElement === document.getElementsByClassName('menu-panelmenu-wrapper')[0]) {
            const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
            setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0)
            handleResize()
        }
    });

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
                            <ScreenManager forwardedRef={sizeRef} />
                        </div>
                    </LayoutContext.Provider>
                </CustomWrapper>
            </div>
            : <div className={concatClassnames("reactUI", appLayout === "corporation" ? "corporation" : "")}>
                <ChangePasswordDialog username={context.contentStore.currentUser.userName} loggedIn={true} />
                {appLayout === "corporation" ? <CorporateMenu /> : <Menu forwardedRef={menuRef} showMenuMini={menuMini} />}
                <LayoutContext.Provider value={componentSize}>
                    <div id="reactUI-main" className={concatClassnames(
                        "main",
                        appLayout === "corporation" ? "main--with-c-menu" : "main--with-s-menu",
                        ((menuCollapsed || (window.innerWidth <= 600 && context.appSettings.menuOverlaying)) && (appLayout === "standard" || appLayout === undefined)) ? " screen-expanded" : "",
                        menuMini ? "" : "screen-no-mini",
                        menuVisibility.toolBar ? "toolbar-visible" : ""
                    )}>
                        <ScreenManager forwardedRef={sizeRef} />
                    </div>
                </LayoutContext.Provider>
            </div>
    )
}
export default UIManager