import BaseComponent from "./BaseComponent";
import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import useLayout from "./zhooks/useLayout";
import {LayoutContext} from "../LayoutContext";

const Dummy: FC<BaseComponent> = (props) => {

    const layoutValue = useContext(LayoutContext);
    const ref = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
       if(props.onLoadCallback && ref.current){
           const size = ref.current.getClientRects();
           props.onLoadCallback(props.id, size[0].height, size[0].width);
       }
    }, [props, ref]);

    return(
        <span ref={ref} style={layoutValue.get(props.id)}>
           Iam a Dummy
        </span>
    )
}
export default Dummy