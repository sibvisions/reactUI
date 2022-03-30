import React, { FC, useLayoutEffect, useRef } from "react";
import BaseComponent from "../util/types/BaseComponent";
import { parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useLayoutValue } from "../hooks";

/**
 * This component gets rendered when there is a component sent by the server which is not yet implemented on the client
 * @param props - Initial properties sent by the server for this component
 */
const Dummy: FC<BaseComponent> = (props) => {
    const { id, onLoadCallback } = props;

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** Reference for the dummy */
    const ref = useRef<HTMLSpanElement>(null);

    // Logs the missing components properties
    useLayoutEffect(() => {
        console.log(props.id, props)
    },[])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(ref.current && onLoadCallback) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), ref.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return(
        <span ref={ref} style={layoutStyle}>
           {`Unsupported UI Component "${props.classNameEventSourceRef ? props.classNameEventSourceRef : props.className} ${props.id}"`}
        </span>
    )
}
export default Dummy