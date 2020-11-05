//React
import React, {
    Children,
    CSSProperties,
    FC, useContext,
    useEffect, useLayoutEffect,
    useRef,
    useState
} from "react";

//Components
import Menu from "./menu/menu";
import "./Layout.scss"

//Utils
import ChildWithProps from "../JVX/components/util/ChildWithProps";
import REQUEST_ENDPOINTS from "../JVX/request/REQUEST_ENDPOINTS";
import {createDeviceStatusRequest} from "../JVX/factories/RequestFactory";

//Context
import {jvxContext} from "../JVX/jvxProvider";
import {LayoutContext} from "../JVX/LayoutContext";






type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}


const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const context = useContext(jvxContext);
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

    useLayoutEffect(() => {
        if (props.children) {
            //@ts-ignore
            setScreenTitle(props.children.props["screen.title"])
        }
        else {
            setScreenTitle(context.server.APP_NAME)
        }
    }, [props.children])

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
    }, [props.children])

    return(
        <div className={"layout " + context.theme}>
            <Menu/>
            <LayoutContext.Provider value={componentSize}>
                <div className="jvxHeader">{screenTitle}</div>
                <div ref={sizeRef} className={"main"}>
                    {props.children}
                </div>
            </LayoutContext.Provider>
        </div>

    )
}
export default Layout