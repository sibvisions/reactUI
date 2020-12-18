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

import useMenuCollapser from "src/JVX/components/zhooks/useMenuCollapser";
import useResponsiveBreakpoints from "src/JVX/components/zhooks/useResponsiveBreakpoints";

type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}


const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef(null);
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

    const menuSize = useResponsiveBreakpoints(menuRef, minusTenArray(240, 80))
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());
    const [screenTitle, setScreenTitle] = useState('')
    const resizeRef = useRef<NodeJS.Timeout | undefined>();
    const deviceRef = useRef<NodeJS.Timeout>(setTimeout(() => {}, 100))

    useLayoutEffect(() => {
        context.contentStore.subscribeToAppName('x', (appName:string) => {
            setScreenTitle(appName)
        });

        return () => {
            context.contentStore.unsubscribeFromAppName('x')
        }
    }, [context.contentStore])

    const doResize = useCallback(() => {
        if(sizeRef.current){
            const size = sizeRef.current.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                console.log(size.width)
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
        window.addEventListener("resize", handleResize);
        window.addEventListener("resize", handleDeviceStatus);
        if (currSizeRef) {
            currSizeRef.addEventListener("transitionstart", () => {
                currSizeRef.classList.add('transition-disable-overflow');
            });
            currSizeRef.addEventListener("transitionend", () => {
                setTimeout(() => {
                    currSizeRef.classList.remove('transition-disable-overflow');
                }, 0)
            });
        }

        return () => {
            window.removeEventListener("resize", handleDeviceStatus);
            window.removeEventListener("resize", handleResize);
            if (currSizeRef) {
                currSizeRef.removeEventListener("transitionstart", () => {
                    currSizeRef.classList.add('transition-disable-overflow');
                });
                currSizeRef.removeEventListener("transitionend", () => {
                    setTimeout(() => {
                        currSizeRef.classList.remove('transition-disable-overflow');
                    }, 0)
                });
            }

        }
    });

    useLayoutEffect(() => {
        doResize();
    }, [props.children, doResize, menuSize])

    return(
        <div className={"layout " + context.theme}>
            <Menu forwardedRef={menuRef}/>
            <LayoutContext.Provider value={componentSize}>
                <div ref={sizeRef} className={"main" + (menuCollapsed  ? " layout-expanded" : "")}>
                    {props.children}
                </div>
            </LayoutContext.Provider>
        </div>

    )
}
export default Layout