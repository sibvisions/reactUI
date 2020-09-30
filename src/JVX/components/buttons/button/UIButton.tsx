import React, {Component, CSSProperties, FC, useContext, useLayoutEffect, useRef} from "react";
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
    const prefSize = useRef<CSSProperties>({})

    useLayoutEffect(()=> {
        if(buttonRef.current && props.onLoadCallback){
            if(props.preferredSize){
                const sizes = props.preferredSize.split(",");
                prefSize.current = {width: sizes[0], height: sizes[1]}
                props.onLoadCallback(props.id, parseInt(sizes[1]), parseInt(sizes[0]));
            } else {
                // @ts-ignore
                const size = buttonRef.current.element.getClientRects();
                props.onLoadCallback(props.id, size[0].height, size[0].width);
            }
        }
    }, [ buttonRef, props]);

    const onButtonPress = () => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
    }


    return(
        <Button
            ref={buttonRef}
            label={props.text}
            id={props.id}
            onClick={onButtonPress}
            style={layoutContext.get(props.id)}
        />
    )
}
export default UIButton;