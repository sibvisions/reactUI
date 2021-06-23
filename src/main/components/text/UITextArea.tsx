/** React imports */
import React, { FC, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { InputTextarea } from "primereact/inputtextarea";

/** Hook imports */
import { useLayoutValue, useProperties } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback } from "../util";

/**
 * This component displays a textarea not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITextArea: FC<BaseComponent> = (baseProps) => {
    /** Reference for the textarea */
    const inputRef = useRef(null);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of the textarea value */
    const [text, setText] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputTextarea ref={inputRef} id={props.name} value={text||""} style={{...layoutStyle, resize: 'none'}} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UITextArea