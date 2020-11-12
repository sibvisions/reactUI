import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {Password} from "primereact/password";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";

const UIPassword: FC<BaseComponent> = (baseProps) => {

    const inputRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);

    const [pwValue, setPwValue] = useState(props.text);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, props.preferredSize, inputRef.current.inputEl, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize])

    return (
        <Password ref={inputRef} value={pwValue||""} feedback={false} style={layoutValue.get(props.id)} onChange={event => setPwValue(event.currentTarget.value)} />
    )
}
export default UIPassword