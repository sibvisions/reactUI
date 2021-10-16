/** React imports */
import React, { FC, useLayoutEffect, useRef } from "react";

/** 3rd Party imports */
import { Tooltip } from 'primereact/tooltip';

/** Hook imports */
import { useLayoutValue, useMouseListener, useProperties } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import {getFont, getAlignments, translateTextAlign} from "../compprops";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, concatClassnames} from "../util";
import usePopupMenu from "../zhooks/usePopupMenu";

/**
 * Displays a simple label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UILabel: FC<BaseComponent> = (baseProps) => {
    /** Reference for label element */
    const labelRef = useRef<HTMLSpanElement>(null);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Alignments for label */
    const lblAlignments = getAlignments(props);
    const lblTextAlignment = translateTextAlign(props.horizontalAlignment);

    /** Font for label */
    const lblFont = getFont(props.font);

    /** Get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    const isHTML = props.text ? props.text.includes("<html>") : false;

    /** Hook for MouseListener */
    useMouseListener(props.name, labelRef.current ? labelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (labelRef.current && onLoadCallback) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, layoutStyle?.width, layoutStyle?.height]);

    /** DangerouslySetInnerHTML because a label should display HTML tags as well e.g. <b> label gets bold */
    return(
        <>
        <Tooltip target={"#" + props.name + "-text"} />
        <span
            {...usePopupMenu(props)}
            id={props.name}
            className={concatClassnames(
                "rc-label",
                isHTML ? " rc-label-html" : "",
                props.eventMousePressed ? "mouse-pressed-event" : ""
            )}
            style={{
                //When the label is html, flex direction is column va and ha alignments need to be swapped
                justifyContent: !isHTML ? lblAlignments.ha : lblAlignments.va,
                alignItems: !isHTML ? lblAlignments.va : lblAlignments.ha,
                backgroundColor: props.background,
                color: props.foreground,
                ...lblTextAlignment,
                ...lblFont,
                ...layoutStyle
            }}>
            <span id={props.name + "-text"} ref={labelRef} dangerouslySetInnerHTML={{ __html: props.text as string }} data-pr-tooltip={props.toolTipText} />
        </span>
        </>
    )
}
export default UILabel
