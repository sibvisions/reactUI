//React
import React, {Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";

//Components
import Menu from "./menu/menu";

//Utils
import ChildWithProps from "../JVX/components/util/ChildWithProps";
import REQUEST_ENDPOINTS from "../JVX/request/REQUEST_ENDPOINTS";
import {createDeviceStatusRequest} from "../JVX/factories/RequestFactory";

//Context
import {jvxContext} from "../JVX/jvxProvider";
import {LayoutContext} from "../JVX/LayoutContext";

import useMenuCollapser from "../JVX/components/zhooks/useMenuCollapser";
import useResponsiveBreakpoints from "../JVX/components/zhooks/useResponsiveBreakpoints";

type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}


const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<any>(null);
    const context = useContext(jvxContext);
    const menuCollapsed = useMenuCollapser('layout');

    const minusTenArray = (start:number, end:number) => {
        const dataArray:number[] = []
        while (start >= end) {
            dataArray.push(start);
            start -= 10;
        }
        return dataArray;
    }

    const menuSize = useResponsiveBreakpoints(menuRef, minusTenArray(240, 80), menuCollapsed)
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());
    const resizeRef = useRef<NodeJS.Timeout | undefined>();
    const deviceRef = useRef<NodeJS.Timeout>(setTimeout(() => {}, 100))

    useEffect(() => {
        let screenTitle = context.server.APP_NAME;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })
            
        if(!screenTitle)
            screenTitle = window.location.hash.split("/")[1];
            
        context.contentStore.notifyAppNameChanged(screenTitle)

    }, [props.children, context.server.APP_NAME, context.contentStore])

    const doResize = useCallback(() => {
        if(sizeRef.current){
            const size = sizeRef.current.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: size.width, height: size.height});
            });
            setComponentSize(sizeMap);
        }
    },[props.children])

    const handleResize = () => {
        if(resizeRef.current){
            return;
        }
        resizeRef.current = setTimeout(() => {
            doResize();
            resizeRef.current = undefined
        }, 23);
    };

    const handleDeviceStatus = () => {
        clearTimeout(deviceRef.current);
        deviceRef.current = setTimeout(() => {
            const deviceStatusReq = createDeviceStatusRequest();
            if(sizeRef.current){
                const mainSize = sizeRef.current.getBoundingClientRect();
                deviceStatusReq.screenHeight = mainSize.height;
                deviceStatusReq.screenWidth = mainSize.width;
                context.server.sendRequest(deviceStatusReq, REQUEST_ENDPOINTS.DEVICE_STATUS);
            }
        }, 150)
    }

    useEffect(() => {
        const currSizeRef = sizeRef.current
        const resizeListenerCall = () => {
            let resizeTimer
            if (currSizeRef)
                currSizeRef.classList.add("transition-disable-overflow");
            handleResize();
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                if (currSizeRef)
                    currSizeRef.classList.remove("transition-disable-overflow")
            },23)
        }
        window.addEventListener("resize", resizeListenerCall)
        window.addEventListener("resize", handleDeviceStatus);
        if (menuRef && currSizeRef) {
            menuRef.current.addEventListener("transitionstart", () => currSizeRef.classList.add('transition-disable-overflow'));
            menuRef.current.addEventListener("transitionend", () => {
                setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0)
                doResize();
            });
        }

        return () => {
            window.removeEventListener("resize", handleDeviceStatus);
            window.removeEventListener("resize", resizeListenerCall);
            if (currSizeRef) {
                currSizeRef.removeEventListener("transitionstart", () => currSizeRef.classList.add('transition-disable-overflow'));
                currSizeRef.removeEventListener("transitionend", () => {
                    setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0);
                    doResize();
                });
            }

        }
    // eslint-disable-next-line
    },[]);

    useLayoutEffect(() => {
        doResize();
    }, [props.children, doResize, menuSize])

    return(
        <div className={"layout"}>
            <Menu forwardedRef={menuRef}/>
            <LayoutContext.Provider value={componentSize}>
                <div ref={sizeRef} className={"main" + ((menuCollapsed || (window.innerWidth <= 600 && context.contentStore.menuOverlaying)) ? " layout-expanded" : "")}>
                    {props.children}
                </div>
            </LayoutContext.Provider>
        </div>

    )
}
export default Layout