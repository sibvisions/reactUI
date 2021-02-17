/** React imports */
import React, {FC, ReactElement, useContext, useLayoutEffect, useRef} from "react";

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import {LayoutContext} from "../../LayoutContext";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";

/** Interface for CustomComponentWrapper */
export interface ICustomComponentWrapper extends BaseComponent {
    component?: ReactElement
}

/**
 * This component wraps a custom-component which is passed when a developer using reactUI as library, so that
 * the necassary methods like onLoadCallback don't have to be implemented by the developer.
 * @param baseProps - Initial properties sent by the server for this component
 */
const UICustomComponentWrapper: FC<ICustomComponentWrapper> = (baseProps) => {
    /** Reference for the custom-component-wrapper element*/
    const wrapperRef = useRef(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<ICustomComponentWrapper>(baseProps.id, baseProps)
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (wrapperRef.current)
            sendOnLoadCallback(id, undefined, undefined, undefined, wrapperRef.current, onLoadCallback);
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    return (
        <span ref={wrapperRef} style={layoutValue.has(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            {props.component}
        </span>
    )
}
export default UICustomComponentWrapper;