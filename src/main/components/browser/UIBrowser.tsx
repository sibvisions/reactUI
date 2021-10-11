/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef } from "react";

/** 3rd Party imports */
import { Tooltip } from 'primereact/tooltip';

/** Hook imports */
import { useProperties, useLayoutValue, useMouseListener } from "../zhooks";

/** Other imports */
import { appContext } from "../../AppProvider";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";
import BaseComponent from "../BaseComponent";
import { parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";

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

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IBrowser>(baseProps.id, baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** Hook for MouseListener */
    useMouseListener(props.name, browserRef.current ? browserRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = browserRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={browserRef} style={layoutStyle}>
            <Tooltip target={"#" + props.name} />
            <iframe
                id={props.name} 
                className="rc-mobile-browser"
                src={props.url}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                data-pr-tooltip={props.toolTipText}
            />
        </span>
    )
}
export default UIBrowser