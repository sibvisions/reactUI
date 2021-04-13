/** React imports */
import React, {FC, useContext, useLayoutEffect, useRef} from "react";

/** Other imports */
import BaseComponent from "./BaseComponent";
import {LayoutContext} from "../LayoutContext";

/**
 * This component gets rendered when there is a component sent by the server which is not yet implemented on the client
 * @param props - Initial properties sent by the server for this component
 */
const Dummy: FC<BaseComponent> = (props) => {
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Reference for the dummy */
    const ref = useRef<HTMLSpanElement>(null);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
       if(props.onLoadCallback && ref.current){
           const size = ref.current.getClientRects();
           props.onLoadCallback(props.id, size[0].height, size[0].width);
       }
    }, [props, ref]);

    return(
        <span ref={ref} style={layoutValue.get(props.id)}>
           Unsupported UI Component
        </span>
    )
}
export default Dummy