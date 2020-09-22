import React, {Component, FC, useContext, useLayoutEffect, useRef} from "react";
import {Button} from "primereact/button";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";

export interface buttonProps extends BaseComponent{
    accelerator: string,
    constraints: string,
    eventAction: boolean,
    text: string,
}

const UIButton: FC<buttonProps> = (props) => {

    const context = useContext(jvxContext)
    const layoutContext = useContext(LayoutContext);
    const buttonRef = useRef<Component>(null);
    // const layoutStyle = useLayout(props.id);

    useLayoutEffect(()=> {
        if(buttonRef.current && props.onLoadCallback){
            // @ts-ignore
            const size = buttonRef.current.element.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    }, [ buttonRef, props]);

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }

    return(
        <Button ref={buttonRef} label={props.text} id={props.id} style={layoutContext.get(props.id)} onClick={onButtonPress}/>
    )
}
export default UIButton;