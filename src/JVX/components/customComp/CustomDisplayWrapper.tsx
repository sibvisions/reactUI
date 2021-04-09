/** React imports */
import React, { FC, PropsWithChildren, ReactElement, useLayoutEffect } from "react";
import { ScreenContext } from "../../../frontmask/ScreenManager";
import WorkScreen from "../../../frontmask/workscreen/WorkScreen";


/** This component is for library users to wrap their custom displays */
const CustomDisplayWrapper:FC<{
    screen?: typeof WorkScreen,
    children: (screen?: ReactElement) => ReactElement
}> = ({screen, children, ...props}) => {

    /** 
     * Adds classname to parent elements of workscreen (parent of parent etc.) with flex styles 
     * so workscreen can fill the remaining space.
     */
    useLayoutEffect(() => {
        let test = document.getElementById("workscreen")?.parentElement
        while (test?.parentElement && test.getAttribute('id') !== "reactUI-main") {
            test.classList.add("custom-display-div");
            test = test.parentElement
        }
    })

    return <ScreenContext.Consumer>{({screen}) => children(screen)}</ScreenContext.Consumer>;
}
export default CustomDisplayWrapper