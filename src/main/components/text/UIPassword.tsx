/** React imports */
import React, { FC, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { Password } from "primereact/password";

/** Hook imports */
import { useComponentConstants, useMouseListener, usePopupMenu } from "../zhooks";

/** Other imports */
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";
import { ITextField } from "./UIText";

/**
 * This component displays an input field of password type not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPassword: FC<ITextField> = (baseProps) => {
    /** Reference for the password field */
    const passwordRef = useRef<any>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<ITextField>(baseProps);

    /** Current state of password value */
    const [pwValue, setPwValue] = useState(props.text);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    
    /** Hook for MouseListener */
    useMouseListener(props.name, passwordRef.current ? passwordRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && passwordRef.current){
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), passwordRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <Password
            inputRef={passwordRef}
            id={props.name}
            className="rc-password"
            value={pwValue||""} 
            feedback={false} 
            style={layoutStyle} 
            onChange={event => setPwValue(event.currentTarget.value)} 
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tooltip={props.toolTipText}
            {...usePopupMenu(props)}
            size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15} />
    )
}
export default UIPassword