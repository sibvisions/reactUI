/** React imports */
import React, { Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import _ from "underscore";

/** Other imports */
import { appContext } from "../main/AppProvider";
import { ChildWithProps } from "../main/components/util";
import { useEventHandler } from "../main/components/zhooks";
import { createDeviceStatusRequest } from "../main/factories/RequestFactory";
import { LayoutContext } from "../main/LayoutContext";
import { REQUEST_ENDPOINTS } from "../main/request";
import { ResizeContext } from "./UIManager";

/**
 * This component handles the screen-size it measures the first container so the panels below can be calculated
 * @param props - contains the children
 */
const ResizeHandler:FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Contains menu-size, if the menu is collapsed and the login page is active and a reference to the menu element */
    const resizeContext = useContext(ResizeContext);

    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);

    /** Current state of the size of the screen-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

    /** The currently active app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
    const doResize = useCallback(() => {
        if (sizeRef.current) {
            const width = sizeRef.current.offsetWidth
            const height = sizeRef.current.offsetHeight
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children, child => {
                const childWithProps = (child as ChildWithProps);
                if (childWithProps.props.id) {
                    sizeMap.set(childWithProps.props.id, { width: width, height: height });
                }
            });
            if (context.appSettings.desktopPanel) {
                let desktopHeight = 0;
                if (resizeContext.login) {
                    desktopHeight = (document.querySelector(".login-container-with-desktop") as HTMLElement).offsetHeight;
                }
                else if (sizeRef.current.parentElement.classList.contains("desktop-panel-enabled")) {
                    desktopHeight = ((document.querySelector(".reactUI") as HTMLElement).offsetHeight) -
                        (appLayout === "corporation" ?
                            (document.querySelector(".c-menu-topbar") as HTMLElement).offsetHeight :
                            parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--s-menu-header-height")));
                }
                if ((resizeContext.login && sizeRef.current.classList.contains("login-container-with-desktop")) || sizeRef.current.parentElement.classList.contains("desktop-panel-enabled")) {
                    sizeMap.set(context.appSettings.desktopPanel.id, { width: width, height: desktopHeight })
                }
            }
            //TODO: maybe fetch ids via screenId instead of relying on the children 
            setComponentSize(sizeMap);
        }
    }, [props.children]);

    /** Using underscore throttle for throttling resize event */
    const handleResize = useCallback(_.throttle(doResize, 23),[doResize, sizeRef.current]);

    /** Using underscore debounce to debounce sending the current devicestatus (screen-container height and width) to the server */
    const handleDeviceStatus = _.debounce(() => {
        const deviceStatusReq = createDeviceStatusRequest();
        deviceStatusReq.screenHeight = window.innerHeight;
        deviceStatusReq.screenWidth = window.innerWidth;
        context.server.sendRequest(deviceStatusReq, REQUEST_ENDPOINTS.DEVICE_STATUS);
    },150);

    /** Resizing when screens or menuSize changes, menuSize changes every 10 pixel resizing every 10 pixel for a smooth transition */
    useLayoutEffect(() => {
        setTimeout(() => handleResize(), 0);
    }, [props.children, handleResize, resizeContext.menuSize]);

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

    /** When the collapse value changes, add menu-transition */
    useLayoutEffect(() => {
        if (sizeRef.current) {
            sizeRef.current.classList.add('transition-disable-overflow');
            sizeRef.current.parentElement.classList.add("menu-transition")
        }
    }, [resizeContext.menuCollapsed])

    //When the menu-tranisition ends, remove classnames and resize
    useEventHandler(resizeContext.menuRef?.current ? resizeContext.menuRef.current : undefined, 'transitionend', (event:any) => {
        if (document.getElementsByClassName('menu-panelmenu-wrapper')[0].contains(event.srcElement) && sizeRef.current) {
            if (event.propertyName === "width") {
                setTimeout(() => {
                    sizeRef.current.classList.remove('transition-disable-overflow');
                    sizeRef.current.parentElement.classList.remove("menu-transition")
                }, 0)
                handleResize();
            }
        }
    });

    return (
        <LayoutContext.Provider value={componentSize}>
            {resizeContext.login ?
                <div className="login-container-with-desktop" ref={sizeRef}>
                    {props.children}
                </div>
                :
                <div id="workscreen" ref={sizeRef} style={{flex: '1'}}>
                    {props.children}
                </div>
            }
        </LayoutContext.Provider>
    )
}
export default ResizeHandler