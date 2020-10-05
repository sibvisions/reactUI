import React, {Component, CSSProperties, FC, useContext, useLayoutEffect, useRef} from "react";
import {Button} from "primereact/button";
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";

export interface buttonProps extends BaseComponent{
    accelerator: string,
    constraints: string,
    eventAction: boolean,
    text: string,
}

const UIButton: FC<buttonProps> = (baseProps) => {

    const context = useContext(jvxContext)
    const layoutContext = useContext(LayoutContext);
    const buttonRef = useRef<Component>(null);
    const prefSize = useRef<{height: number, width:number }>({width:0, height:0});

    const [props] = useProperties<buttonProps>(baseProps.id, baseProps);

    useLayoutEffect(()=> {
        const load = props.onLoadCallback;
        if(buttonRef.current && prefSize.current.height === 0){
            if(props.preferredSize ){
                const sizes = props.preferredSize.split(",");
                prefSize.current = {width: parseInt(sizes[0]), height: parseInt(sizes[1])}
            } else {
                // @ts-ignore
                const size = buttonRef.current.element.getBoundingClientRect();
                prefSize.current = {width: size.width, height: size.height};
            }
        }
        if(load){
            console.log(prefSize.current)
            load(props.id, prefSize.current.height, prefSize.current.width)
        }
    }, [buttonRef, props.preferredSize, props.onLoadCallback, props.id]);

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