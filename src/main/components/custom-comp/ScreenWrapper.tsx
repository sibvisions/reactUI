import React, { FC, ReactElement, useEffect } from "react";
import { ScreenContext } from "../../../application-frame/screen-management/ScreenManager";
import WorkScreen from "../../../application-frame/screen-management/workscreen/WorkScreen";


/** This component is for library users to wrap their screen-wrapper */
const ScreenWrapper:FC<{
    screen?: typeof WorkScreen,
    children: (screen?: ReactElement) => ReactElement,
    onOpen?: Function
}> = ({screen, children, ...props}) => {

    /** 
     * Adds classname to parent elements of workscreen (parent of parent etc.) with flex styles 
     * so workscreen can fill the remaining space.
     */
    useEffect(() => {
        if (props.onOpen) {
            props.onOpen();
        }

        let test = document.getElementById("workscreen")?.parentElement
        while (test?.parentElement && test.getAttribute('id') !== "reactUI-main") {
            test.classList.add("screen-wrapper-div");
            test = test.parentElement
        }
    },[])

    return <ScreenContext.Consumer>{({screen}) => children(screen)}</ScreenContext.Consumer>;
}
export default ScreenWrapper