import React, { FC, useLayoutEffect, useRef, useState } from "react";
import { Password } from "primereact/password";
import { useComponentConstants, useMouseListener, usePopupMenu } from "../zhooks";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, concatClassnames, checkComponentName, handleEnterKey, sendSetValue} from "../util";
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
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<ITextField>(baseProps);

    /** Current state of password value */
    const [pwValue, setPwValue] = useState(props.text || "");

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

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
            id={checkComponentName(props.name)}
            className="rc-input"
            value={pwValue||""} 
            feedback={false} 
            style={{...layoutStyle, ...compStyle}} 
            onChange={event => setPwValue(event.currentTarget.value)} 
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={() => {
                sendSetValue(props.name, pwValue, context.server, lastValue.current, topbar);
                lastValue.current = pwValue;

                if (props.eventFocusLost) {
                    onFocusLost(props.name, context.server)
                }
            }}
            tooltip={props.toolTipText}
            tooltipOptions={{ position: "left" }}
            {...usePopupMenu(props)}
            size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15}
            onKeyDown={(e) => handleEnterKey(e, e.target, props.name)}
            disabled={props.enabled === false} />
    )
}
export default UIPassword