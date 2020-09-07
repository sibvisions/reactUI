import React, {FC, useLayoutEffect, useRef} from "react";
import BaseComponent from "../BaseComponent";
import useLayout from "../zhooks/useLayout";

export interface uiLabel extends BaseComponent {
    text: string
}

const UILabel: FC<uiLabel> = (props) => {
    const labelRef = useRef<HTMLSpanElement>(null)
    const layoutStyle = useLayout(props.id)

    useLayoutEffect(() => {
        if(!layoutStyle && labelRef.current && props.onLoadCallback){
            const size = labelRef.current.getClientRects();
            props.onLoadCallback(props.id, size[0].height, size[0].width);
        }
    });


    return(
        <span ref={labelRef} style={layoutStyle}>
            {props.text}
        </span>
    )
}
export default UILabel