/** React imports */
import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";

/** 3rd Party imports */
import {InputText} from "primereact/inputtext";

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import {parsePrefSize, parseMinSize, parseMaxSize} from "../util/parseSizes";

/**
 * This component displays an input field not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIText: FC<BaseComponent> = (baseProps) => {
    /** Reference for the input field */
    const inputRef = useRef(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of the text value */
    const [text, setText] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current.element, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputText ref={inputRef} value={text||""} style={layoutValue.get(props.id)} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UIText