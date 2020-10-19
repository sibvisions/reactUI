import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";

export interface uiLabel extends BaseComponent {
    text: string
}

const UILabel: FC<uiLabel> = (baseProps) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const layoutValue = useContext(LayoutContext);

    const [props] = useProperties<uiLabel>(baseProps.id, baseProps);

    useLayoutEffect(() => {
        if(labelRef.current && props.onLoadCallback && !layoutValue.get(props.id)){
            const size = labelRef.current.getBoundingClientRect();
            props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [labelRef, props, layoutValue]);


    return(
        <span ref={labelRef} style={layoutValue.get(props.id)}>
            {props.text}
        </span>
    )
}
export default UILabel