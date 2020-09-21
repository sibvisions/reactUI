import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import BaseComponent from "../BaseComponent";
import useLayout from "../zhooks/useLayout";
import {LayoutContext} from "../../LayoutContext";

export interface uiLabel extends BaseComponent {
    text: string
}

const UILabel: FC<uiLabel> = (props) => {
    const labelRef = useRef<HTMLSpanElement>(null)
    const layoutValue = useContext(LayoutContext);

    useLayoutEffect(() => {
        if(labelRef.current && props.onLoadCallback){
            const size = labelRef.current.getBoundingClientRect();
            props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [labelRef, props]);


    return(
        <span ref={labelRef} style={layoutValue.get(props.id)}>
            {props.text}
        </span>
    )
}
export default UILabel