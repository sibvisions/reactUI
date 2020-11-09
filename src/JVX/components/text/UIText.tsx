import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {InputText} from "primereact/inputtext";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";

const UIText: FC<BaseComponent> = (baseProps) => {

    const inputRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);

    const [text, setText] = useState("");
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            sendOnLoadCallback(id, props.preferredSize, inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id])

    return (
        <InputText ref={inputRef} value={text||""} style={layoutValue.get(props.id)} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UIText