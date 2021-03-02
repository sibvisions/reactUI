import React, { FC, useEffect, useLayoutEffect } from "react";

const CustomDisplayWrapper:FC = (props) => {

    useLayoutEffect(() => {
        let test = document.getElementById("workscreen")?.parentElement
        while (test?.parentElement && test.getAttribute('id') !== "reactUI-main") {
            console.log(test)
            test.classList.add("customDisplayDiv");
            test = test.parentElement
        }
    })

    return (<>{props.children}</>)
}
export default CustomDisplayWrapper