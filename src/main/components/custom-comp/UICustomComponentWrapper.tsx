import React, { FC, ReactElement, useLayoutEffect, useRef } from "react";
import { useComponentConstants } from "../zhooks";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util";

/** Interface for CustomComponentWrapper */
export interface ICustomComponentWrapper extends BaseComponent {
    component: ReactElement,
    isGlobal:boolean
}

/**
 * This component wraps a custom-component which is passed when a developer using reactUI as library, so that
 * the necassary methods like onLoadCallback don't have to be implemented by the developer.
 * @param baseProps - Initial properties sent by the server for this component
 */
const UICustomComponentWrapper: FC<ICustomComponentWrapper> = (baseProps) => {
    /** Reference for the custom-component-wrapper element*/
    const wrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<ICustomComponentWrapper>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout.
     * Remove the positioning and size properties before, so the custom-component reports its own size and not the component sent by the server.
     */
    useLayoutEffect(() => {
        if (wrapperRef.current) {
            const ref = wrapperRef.current
            ref.style.removeProperty("top");
            ref.style.removeProperty("left");
            ref.style.removeProperty("width");
            ref.style.removeProperty("height");
            sendOnLoadCallback(id, props.className, undefined, {width: 0x80000000, height: 0x80000000}, {width: 0, height: 0}, wrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.minimumSize, props.maximumSize]);

    return (
        <span ref={wrapperRef} style={layoutStyle}>
            {baseProps.isGlobal ? context.contentStore.globalComponents.get(props.className)!.apply(undefined, [{...props}]) : baseProps.component}
        </span>
    )
}
export default UICustomComponentWrapper;