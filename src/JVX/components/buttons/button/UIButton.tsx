import React, {Component, FC, ReactHTMLElement, useContext, useEffect, useRef} from "react";
import {Button} from "primereact/button";
import useLayout from "../../zhooks/useLayout";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

export type buttonProps = {
    accelerator: string,
    className: string,
    constraints: string,
    eventAction: boolean,
    id: string,
    indexOf: number,
    name: string,
    parent: string,
    text: string,
    onLoadCallback: Function,
    isVisible: boolean;
}

const UIButton: FC<buttonProps> = (props) => {

    const context = useContext(jvxContext)
    const buttonRef = useRef<Component>(null);
    const layoutStyle = useLayout(props.id);

    useEffect(()=> {
        if(buttonRef.current && !layoutStyle){
            // @ts-ignore
            const size = buttonRef.current.element.getBoundingClientRect();
            props.onLoadCallback({width: size.width, height: size.height, id: props.id});
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