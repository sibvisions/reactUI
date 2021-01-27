import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import {getFont} from "../compprops/ComponentProperties";
import {checkAlignments} from "../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import { parseJVxSize } from "../util/parseJVxSize";

const UILabel: FC<BaseComponent> = (baseProps) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    
    const {onLoadCallback, id} = baseProps;
    const lblAlignments = checkAlignments(props);
    const lblFont = getFont(props.font);

    useLayoutEffect(() => {
        if(labelRef.current && onLoadCallback){
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), labelRef.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);


    return(
        <span ref={labelRef} dangerouslySetInnerHTML={{__html: props.text as string}} className={"rc-label" + ((props.text as string).includes("<html>") ? " rc-label-html" : "")} style={layoutValue.get(props.id) ? {
            justifyContent: lblAlignments.ha,
            alignItems: lblAlignments.va,
            backgroundColor: props.background,
            color: props.foreground,
            ...lblFont,
            ...layoutValue.get(props.id)
        } : {
                justifyContent: lblAlignments.ha,
                alignContent: lblAlignments.va,
                backgroundColor: props.background,
                color: props.foreground,
                ...lblFont,
            }}>
        </span>
    )
}
export default UILabel