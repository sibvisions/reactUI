//React
import React, {
    Children,
    CSSProperties,
    FC, useContext,
    useEffect, useLayoutEffect, useMemo,
    useRef,
    useState
} from "react";

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

type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}


const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const context = useContext(jvxContext);
    const menuCollapsed = useMenuCollapser('layout');
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

    const screenTitleMemo = useMemo(() => {
        let screenTitle = context.server.APP_NAME;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })
            
        if(!screenTitle)
            screenTitle = window.location.hash.split("/")[1];
            
        return screenTitle

    }, [props.children, context.server.APP_NAME])

    const doResize = () => {
        if(sizeRef.current){
            const size = sizeRef.current.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                    sizeMap.set(childWithProps.props.id, {width: size.width, height: size.height});
            });
            setComponentSize(sizeMap);
        }
    }

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
       window.addEventListener("resize", handleResize);
       window.addEventListener("resize", handleDeviceStatus);
       return () => {
           window.removeEventListener("resize", handleDeviceStatus)
           window.removeEventListener("resize", handleResize);
       }
    });

    useEffect(() => {
        console.log(sizeRef.current, menuCollapsed)
    })

    useLayoutEffect(() => {
        if(sizeRef.current){
            const size = sizeRef.current.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: size.width, height: size.height});
            });
            setComponentSize(sizeMap);
        }
    }, [props.children, menuCollapsed])

    return(
        <div className={"layout " + context.theme}>
            <Menu/>
            <LayoutContext.Provider value={componentSize}>
                <div ref={sizeRef} className={"main" + (menuCollapsed ? " expanded" : "")}>
                    {props.children}
                </div>
            </LayoutContext.Provider>
        </div>

    )
}
export default Layout