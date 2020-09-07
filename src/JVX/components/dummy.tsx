import BaseComponent from "./BaseComponent";
import React, {FC, useLayoutEffect, useRef} from "react";
import useLayout from "./zhooks/useLayout";

const Dummy: FC<BaseComponent> = (props) => {

    const layoutStyle = useLayout(props.id);
    const ref = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
       if(!layoutStyle && props.onLoadCallback && ref.current){
           const size = ref.current.getClientRects();
           props.onLoadCallback(props.id, size[0].height, size[0].width);
       }
    });

    return(
        <span ref={ref} style={layoutStyle}>
           Iam a Dummy
        </span>
    )
}
export default Dummy