import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import {InputSwitch} from 'primereact/inputswitch';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { IToggleButton } from "./UIToggleButton";
import { parseJVxSize } from "../../util/parseJVxSize";

const UIInputSwitch: FC<IToggleButton> = (baseProps) => {
    const inputRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IToggleButton>(baseProps.id, baseProps);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if (inputRef.current)
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current, onLoadCallback)
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    const handleOnChange = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return (
        <span className="rc-inputswitch" ref={inputRef} style={layoutValue.has(id) ? layoutValue.get(id) : {position: "absolute"}}>
            <span className="rc-inputswitch-label">{props.text}</span>
            <InputSwitch checked={props.selected} onChange={handleOnChange} />
        </span>
    )
}
export default UIInputSwitch