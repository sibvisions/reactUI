/** React imports */
import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";

/** 3rd Party imports */
import {Password} from "primereact/password";

/** Hook imports */
import useProperties from "../zhooks/useProperties";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import { sendOnLoadCallback } from "../util/SendOnLoadCallback";
import {parsePrefSize, parseMinSize, parseMaxSize} from "../util/parseSizes";

/**
 * This component displays an input field of password type not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPassword: FC<BaseComponent> = (baseProps) => {
    /** Reference for the password field */
    const passwordRef = useRef(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of password value */
    const [pwValue, setPwValue] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && passwordRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), passwordRef.current.inputEl, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <Password ref={passwordRef} value={pwValue||""} feedback={false} style={layoutValue.get(props.id)} onChange={event => setPwValue(event.currentTarget.value)} />
    )
}
export default UIPassword