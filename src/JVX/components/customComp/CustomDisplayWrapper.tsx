/** React imports */
import React, { FC, useLayoutEffect } from "react";

/** This component is for library users to wrap their custom displays */
const CustomDisplayWrapper:FC = (props) => {

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

    return (<>{props.children}</>)
}
export default CustomDisplayWrapper