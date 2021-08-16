/** React imports */
import React, { FC, ReactElement, useContext, useLayoutEffect, useRef } from "react";

/** Hook imports */
import { useLayoutValue, useProperties } from "../zhooks";

/** Other imports */
import { LayoutContext } from "../../LayoutContext";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util";

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
    /** get the layout style value */
    const layoutStyle = useLayoutValue(baseProps.id);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<ICustomComponentWrapper>(baseProps.id, baseProps)
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (wrapperRef.current) {
            sendOnLoadCallback(id, undefined, {width: 0x80000000, height: 0x80000000}, {width: 0, height: 0}, wrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    return (
        <span ref={wrapperRef} style={layoutStyle}>
            {baseProps.component}
        </span>
    )
}
export default UICustomComponentWrapper;