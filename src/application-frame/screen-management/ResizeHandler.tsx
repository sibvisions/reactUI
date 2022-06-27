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

import React, { Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import _ from "underscore";
import { appContext } from "../../main/contexts/AppProvider";
import { createDeviceStatusRequest } from "../../main/factories/RequestFactory";
import { LayoutContext } from "../../main/LayoutContext";
import { isCorporation } from "../../main/util/server-util/IsCorporation";
import { ResizeContext } from "../../main/contexts/ResizeProvider";
import ChildWithProps from "../../main/util/types/ChildWithProps";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import useEventHandler from "../../main/hooks/event-hooks/useEventHandler";

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

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** The currently active app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** Subscribes the resize-handler to the theme */
    useEffect(() => {
        context.subscriptions.subscribeToTheme("resizeHandler", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTheme("resizeHandler");
        }
    }, [context.subscriptions]);

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
    const doResize = useCallback(() => {
        /**
         * Returns the height of the desktop-panel
         * @param login - True, if the app is currently on login 
         */
        const getDesktopHeight = (login?:boolean) => {
            let height = 0;
            if (sizeRef.current) {
                if (login) {
                    height = (document.querySelector(".login-container-with-desktop") as HTMLElement).offsetHeight;
                }
                else {
                    const reactUIHeight = (document.querySelector(".reactUI") as HTMLElement).offsetHeight
                    let minusHeight = 0;
                    if (isCorporation(appLayout, appTheme) && document.querySelector(".corp-menu-topbar")) {
                        minusHeight = (document.querySelector(".corp-menu-topbar") as HTMLElement).offsetHeight
                        height = reactUIHeight - minusHeight;
                    }
                    else {
                        minusHeight = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue((appTheme === "basti_mobile" && window.innerWidth <= 530) ? "--std-header-mini-height" : "--std-header-height"))
                        height = reactUIHeight - minusHeight;
                    }
                }
            }
            return height;
        }

        /** When the window width is 530px or smaller and the applayout is corp, change the applayout to standard, while the window width is <= 530px */
        if (appLayout === "corporation" && resizeContext.setMobileStandard) {
            if (resizeContext.mobileStandard === false && window.innerWidth <= 530) {
                resizeContext.setMobileStandard(true);
            }
            else if (resizeContext.mobileStandard === true && window.innerWidth > 530) {
                resizeContext.setMobileStandard(false)
            }
        }

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
            sizeMap.set("root", { width: width, height: height });
            if (context.appSettings.desktopPanel) {
                let desktopHeight = getDesktopHeight(resizeContext.login);
                if ((resizeContext.login && sizeRef.current.classList.contains("login-container-with-desktop")) || sizeRef.current.parentElement.classList.contains("desktop-panel-enabled")) {
                    sizeMap.set(context.appSettings.desktopPanel.id, { width: width, height: desktopHeight })
                }
            }
            //TODO: maybe fetch ids via screenId instead of relying on the children 
            setComponentSize(sizeMap);
        }
    }, [props.children]);

    /** Using underscore throttle for throttling resize event */
    const handleResize = useCallback(_.throttle(doResize, 50),[doResize, sizeRef.current]);

    /** Using underscore debounce to debounce sending the current devicestatus (screen-container height and width) to the server */
    const handleDeviceStatus = _.debounce(() => {
        const deviceStatusReq = createDeviceStatusRequest();
        deviceStatusReq.screenHeight = window.innerHeight;
        deviceStatusReq.screenWidth = window.innerWidth;
        context.server.sendRequest(deviceStatusReq, REQUEST_KEYWORDS.DEVICE_STATUS);
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