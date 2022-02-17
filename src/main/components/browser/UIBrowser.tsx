/** React imports */
import React, { FC, useLayoutEffect, useRef } from "react";

/** 3rd Party imports */
import { Tooltip } from 'primereact/tooltip';

/** Hook imports */
import { useMouseListener, usePopupMenu, useComponentConstants } from "../zhooks";

/** Other imports */
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";
import BaseComponent from "../BaseComponent";
import { concatClassnames, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";

export interface IBrowser extends BaseComponent {
    url: string;
}

/**
 * This component displays an iframe
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIBrowser: FC<IBrowser> = (baseProps) => {
    /** Reference for the browser element */
    const browserRef = useRef<any>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translation, compStyle, styleClassName] = useComponentConstants<IBrowser>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, browserRef.current ? browserRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = browserRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={browserRef} style={layoutStyle}>
            <Tooltip target={"#" + props.name} />
            <iframe
                id={props.name} 
                className={concatClassnames("rc-mobile-browser", styleClassName.bgdClassName, styleClassName.fgdClassName)}
                style={{...compStyle}}
                src={props.url}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
            />
        </span>
    )
}
export default UIBrowser