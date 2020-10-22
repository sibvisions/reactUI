import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import { getFont, getMargins } from "../compprops/ComponentProperties";
import { checkAlignments } from "../compprops/CheckAlignments";

export interface uiLabel extends BaseComponent {
    text: string
}

const UILabel: FC<uiLabel> = (baseProps) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const layoutValue = useContext(LayoutContext);

    const [props] = useProperties<uiLabel>(baseProps.id, baseProps);

    const lblMargins = getMargins(props);
    const lblAlignments = checkAlignments(props);
    const lblFont = getFont(props);

    useLayoutEffect(() => {
        if(labelRef.current && props.onLoadCallback && !layoutValue.get(props.id)){
            const size = labelRef.current.getBoundingClientRect();
            props.onLoadCallback(props.id, size.height, size.width);
        }
    }, [labelRef, props, layoutValue]);


    return(
        <span ref={labelRef} style={layoutValue.get(props.id) ? {
            display: 'inline-flex',
            justifyContent: lblAlignments?.ha,
            alignContent: lblAlignments?.va,
            backgroundColor: props.background,
            color: props.foreground,
            fontFamily: lblFont.fontFamily,
            fontWeight: lblFont.fontWeight,
            fontStyle: lblFont.fontStyle,
            fontSize: lblFont.fontSize,
            paddingTop: lblMargins.marginTop,
            paddingLeft: lblMargins.marginLeft,
            paddingBottom: lblMargins.marginBottom,
            paddingRight: lblMargins.marginRight,
            ...layoutValue.get(props.id)
        } : {
                position: "absolute",
            }}>
            {props.text}
        </span>
    )
}
export default UILabel