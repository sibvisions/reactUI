/** React imports */
import React, { FC, useContext, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { Password } from "primereact/password";

/** Hook imports */
import { useLayoutValue, useMouseListener, usePopupMenu, useProperties } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";
import { appContext } from "../../AppProvider";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";

/**
 * This component displays an input field of password type not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPassword: FC<BaseComponent> = (baseProps) => {
    /** Reference for the password field */
    const passwordRef = useRef<any>(null);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);

    /** Current state of password value */
    const [pwValue, setPwValue] = useState(props.text);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    
    /** Hook for MouseListener */
    useMouseListener(props.name, passwordRef.current ? passwordRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && passwordRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), passwordRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <Password 
            inputRef={passwordRef} 
            id={props.name} 
            value={pwValue||""} 
            feedback={false} 
            style={layoutStyle} 
            onChange={event => setPwValue(event.currentTarget.value)} 
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tooltip={props.toolTipText}
            {...usePopupMenu(props)} />
    )
}
export default UIPassword