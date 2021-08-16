import { Children, CSSProperties, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import _ from "underscore";
import { appContext } from "../../AppProvider";
import { createDeviceStatusRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { ChildWithProps } from "../util";
import useEventHandler from "./useEventHandler";

const useResizeHandler = (sizeRef:React.MutableRefObject<any>, children:React.ReactNode, menuSize?:number, menuRef?:React.MutableRefObject<any>) => {
    /** Current state of the size of the screen-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
     const doResize = useCallback(() => {
        if(sizeRef.current || document.querySelector('#workscreen')){
            const width = sizeRef.current ? sizeRef.current.offsetWidth : (document.querySelector('#workscreen') as HTMLElement)!.offsetWidth;
            const height = sizeRef.current ? sizeRef.current.offsetHeight : (document.querySelector('#workscreen') as HTMLElement)!.offsetHeight;
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: width, height: height});
            });
            if (context.appSettings.desktopPanel) {
                sizeMap.set(context.appSettings.desktopPanel.id, {width: width, height: height})
            }

            //TODO: maybe fetch ids via screenId instead of relying on the children 
            setComponentSize(sizeMap);
        }
    },[children]);

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
    }, [children, handleResize, menuSize]);

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

    useEventHandler(menuRef?.current ? menuRef.current : undefined, 'transitionstart', (event:any) => {
        if (event.propertyName === "width" && event.srcElement === document.getElementsByClassName('menu-panelmenu-wrapper')[0]) {
            const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
            currSizeRef.classList.add('transition-disable-overflow');
        }
    })

    useEventHandler(menuRef?.current ? menuRef.current : undefined, 'transitionend', (event:any) => {
        if (event.propertyName === "width" && event.srcElement === document.getElementsByClassName('menu-panelmenu-wrapper')[0]) {
            const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
            setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0)
            handleResize()
        }
    });

    return componentSize
}
export default useResizeHandler;