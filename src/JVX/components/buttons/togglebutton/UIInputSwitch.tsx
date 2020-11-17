import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import './UIToggleButton.scss';
import {InputSwitch} from 'primereact/inputswitch';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { IToggleButton } from "./UIToggleButton";

const UIInputSwitch: FC<IToggleButton> = (baseProps) => {
    const inputRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IToggleButton>(baseProps.id, baseProps);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if (inputRef.current)
            sendOnLoadCallback(id, props.preferredSize, inputRef.current, onLoadCallback)
    })

    const handleOnChange = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return (
        <span className="jvxInputSwitch" ref={inputRef} style={layoutValue.has(id) ? layoutValue.get(id) : {position: "absolute"}}>
            <span className="jvxInputSwitch-label">{props.text}</span>
            <InputSwitch checked={props.selected} onChange={handleOnChange} />
        </span>
    )
}
export default UIInputSwitch