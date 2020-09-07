import React, {Component, FC, useContext, useEffect, useRef} from "react";
import {Button} from "primereact/button";
import useLayout from "../../zhooks/useLayout";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import BaseComponent from "../../BaseComponent";

export interface buttonProps extends BaseComponent{
    accelerator: string,
    constraints: string,
    eventAction: boolean,
    text: string,
}

const UIButton: FC<buttonProps> = (props) => {

    const context = useContext(jvxContext)
    const buttonRef = useRef<Component>(null);
    const layoutStyle = useLayout(props.id);

    useEffect(()=> {
        if(buttonRef.current && !layoutStyle && props.onLoadCallback){
            // @ts-ignore
            const size = buttonRef.current.element.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    });

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <Button ref={buttonRef} label={props.text} id={props.id} style={layoutStyle} onClick={onButtonPress}/>
    )
}
export default UIButton;