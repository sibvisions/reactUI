/** React imports */
import React, { FC, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";

/** Hook imports */
import { useComponentConstants, useMouseListener, usePopupMenu } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, concatClassnames, checkComponentName} from "../util";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";

export interface ITextField extends BaseComponent {
    columns?:number
}

/**
 * This component displays an input field not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIText: FC<ITextField> = (baseProps) => {
    /** Reference for the input field */
    const inputRef = useRef<any>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<ITextField>(baseProps);

    /** Current state of the text value */
    const [text, setText] = useState(props.text);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, inputRef.current ? inputRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputText 
            ref={inputRef} 
            id={checkComponentName(props.name)}
            className="rc-input"
            value={text||""} 
            style={{...layoutStyle, ...compStyle}} 
            onChange={event => setText(event.currentTarget.value)}
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tooltip={props.toolTipText}
            tooltipOptions={{ position: "left" }}
            {...usePopupMenu(props)}
            size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15}
        />
    )
}
export default UIText