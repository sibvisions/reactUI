/** React imports */
import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";

/** 3rd Party imports */
import {InputTextarea} from "primereact/inputtextarea";

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";

/**
 * This component displays a textarea not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITextArea: FC<BaseComponent> = (baseProps) => {
    /** Reference for the textarea */
    const inputRef = useRef(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of the textarea value */
    const [text, setText] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputTextarea ref={inputRef} value={text||""} style={{...layoutValue.get(props.id), resize: 'none'}} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UITextArea