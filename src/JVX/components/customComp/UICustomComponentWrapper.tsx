import React, {FC, ReactElement, useContext, useLayoutEffect, useRef} from "react";
import {LayoutContext} from "../../LayoutContext";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import useProperties from "../zhooks/useProperties";

export interface ICustomComponentWrapper extends BaseComponent {
    component?: ReactElement
}

const UICustomComponentWrapper: FC<ICustomComponentWrapper> = (baseProps) => {
    const wrapperRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<ICustomComponentWrapper>(baseProps.id, baseProps)
    const {onLoadCallback} = props;

    useLayoutEffect(() => {
        if (wrapperRef.current)
            sendOnLoadCallback(props.id, undefined, undefined, undefined, wrapperRef.current, onLoadCallback);
    });

    return (
        <span ref={wrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            {props.component}
        </span>
    )
}
export default UICustomComponentWrapper;