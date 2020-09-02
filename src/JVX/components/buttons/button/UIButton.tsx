import React, {Component, FC, useEffect, useRef} from "react";
import {Button} from "primereact/button";
import useLayout from "../../zhooks/useLayout";

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

    const buttonRef = useRef<Component>(null);
    const layoutStyle = useLayout(props.id);

    useEffect(()=> {
        if(buttonRef.current){
            // @ts-ignore
            props.onLoadCallback({width: buttonRef.current.element.clientWidth, height: buttonRef.current.element.clientHeight, id: props.id});
        }


    });

    return(
        <Button ref={buttonRef} label={props.text} id={props.id} style={layoutStyle}/>
    )
}
export default UIButton;