import React, { FC, useLayoutEffect, useRef, useState } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { useComponentConstants, useMouseListener, usePopupMenu } from "../../hooks";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, checkComponentName, sendSetValue, handleEnterKey, isCompDisabled, getTabIndex, concatClassnames } from "../../util";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import { ITextField } from "./UIText";

interface ITextArea extends ITextField {
    rows?:number
}

/**
 * This component displays a textarea not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITextArea: FC<ITextArea> = (baseProps) => {
    /** Reference for the textarea */
    const inputRef = useRef<any>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<ITextArea>(baseProps);

    /** Current state of the textarea value */
    const [text, setText] = useState(props.text || "");
    
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

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
        <InputTextarea 
            ref={inputRef} 
            id={checkComponentName(props.name)}
            className={concatClassnames(
                "rc-input", 
                props.focusable === false ? 
                "no-focus-rect" : "",
                isCompDisabled(props) ? "rc-input-readonly" : ""
            )}
            value={text||""}
            style={{...layoutStyle, ...compStyle, resize: 'none'}} 
            onChange={event => setText(event.currentTarget.value)} 
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={() => {
                if (!isCompDisabled(props)) {
                    sendSetValue(props.name, text, context.server, lastValue.current, topbar);
                    lastValue.current = text;
    
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, context.server)
                    }
                }
            }}
            tooltip={props.toolTipText}
            tooltipOptions={{ position: "left" }}
            {...usePopupMenu(props)}
            cols={props.columns !== undefined && props.columns >= 0 ? props.columns : 18}
            rows={props.rows !== undefined && props.rows >= 0 ? props.rows : 5}
            onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                    handleEnterKey(e, e.target, props.name);
                }
            }}
            readOnly={isCompDisabled(props)}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)} />
    )
}
export default UITextArea