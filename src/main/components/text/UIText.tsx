/** React imports */
import React, { FC, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";

/** Hook imports */
import { useLayoutValue, useMouseListener, useProperties } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";

/**
 * This component displays an input field not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIText: FC<BaseComponent> = (baseProps) => {
    /** Reference for the input field */
    const inputRef = useRef<any>(null);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of the text value */
    const [text, setText] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** Hook for MouseListener */
    useMouseListener(props.name, inputRef.current ? inputRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputText ref={inputRef} id={props.name} value={text||""} style={layoutStyle} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UIText