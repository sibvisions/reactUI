import React, { FC, useLayoutEffect } from "react";

const CustomDisplayWrapper:FC = (props) => {

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