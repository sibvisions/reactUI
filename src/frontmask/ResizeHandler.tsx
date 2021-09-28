import React, { Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import _ from "underscore";
import { appContext } from "../main/AppProvider";
import { ChildWithProps } from "../main/components/util";
import { useEventHandler } from "../main/components/zhooks";
import { createDeviceStatusRequest } from "../main/factories/RequestFactory";
import { LayoutContext } from "../main/LayoutContext";
import { REQUEST_ENDPOINTS } from "../main/request";
import { ResizeContext } from "./UIManager";



const ResizeHandler:FC = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const resizeContext = useContext(ResizeContext);

    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);

    /** Current state of the size of the screen-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
     const doResize = useCallback(() => {
         if (sizeRef.current || document.querySelector('#workscreen')) {
             const width = sizeRef.current ? sizeRef.current.offsetWidth : (document.querySelector('#workscreen') as HTMLElement)!.offsetWidth;
             const height = sizeRef.current ? sizeRef.current.offsetHeight : (document.querySelector('#workscreen') as HTMLElement)!.offsetHeight;
             const sizeMap = new Map<string, CSSProperties>();
             Children.forEach(props.children, child => {
                 const childWithProps = (child as ChildWithProps);
                 sizeMap.set(childWithProps.props.id, { width: width, height: height });
             });
             if (context.appSettings.desktopPanel) {
                 sizeMap.set(context.appSettings.desktopPanel.id, { width: width, height: height })
             }

             //TODO: maybe fetch ids via screenId instead of relying on the children 
             setComponentSize(sizeMap);
         }
    },[props.children]);

    /** Using underscore throttle for throttling resize event */
    const handleResize = useCallback(_.throttle(doResize, 23),[doResize, sizeRef.current]);

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

    useEventHandler(resizeContext.menuRef?.current ? resizeContext.menuRef.current : undefined, 'transitionstart', (event:any) => {
        if (event.propertyName === "width" && event.srcElement === document.getElementsByClassName('menu-panelmenu-wrapper')[0]) {
            const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
            currSizeRef.classList.add('transition-disable-overflow');
        }
    })

    useEventHandler(resizeContext.menuRef?.current ? resizeContext.menuRef.current : undefined, 'transitionend', (event:any) => {
        if (document.getElementsByClassName('menu-panelmenu-wrapper')[0].contains(event.srcElement)) {
            if (event.propertyName === "width") {
                const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
                setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0)
                handleResize();
            }
            else if (event.propertyName === "max-height") {
                handleResize();
            }
        }
    });

    useEventHandler(document.getElementById("reactUI-main") as HTMLElement, 'transitionend', (event:any) => {
        if (event.propertyName === "margin-left") {
            handleResize()
        }
    });

    return (
        <LayoutContext.Provider value={componentSize}>
            {resizeContext.login ?
                <div className="login-container-with-desktop" ref={sizeRef}>
                    {props.children}
                </div>
                :
                <div id="workscreen" ref={sizeRef} style={{flex: '1', ...resizeContext.style}}>
                    {props.children}
                </div>
            }
        </LayoutContext.Provider>
    )
}
export default ResizeHandler