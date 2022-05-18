/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useLayoutEffect, useMemo, useRef } from "react";
import { Tooltip } from 'primereact/tooltip';
import { useComponentConstants, useMouseListener } from "../../hooks";
import BaseComponent from "../../util/types/BaseComponent";
import {getAlignments, translateTextAlign} from "../comp-props";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, concatClassnames, checkComponentName, getTabIndex} from "../../util";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";

/**
 * Displays a simple label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UILabel: FC<BaseComponent> = (baseProps) => {
    /** Reference for label element */
    const labelRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [,, [props], layoutStyle,, compStyle] = useComponentConstants<BaseComponent>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Alignments for label */
    const lblAlignments = getAlignments(props);

    /** The text-alignment of the label */
    const lblTextAlignment = translateTextAlign(props.horizontalAlignment);

    /** True, if the label contains html */
    const isHTML = useMemo(() => props.text ? props.text.includes("<html>") : false, [props.text]);

    /** Hook for MouseListener */
    useMouseListener(props.name, labelRef.current ? labelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (labelRef.current && onLoadCallback) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, layoutStyle?.width, layoutStyle?.height]);

    /** DangerouslySetInnerHTML because a label should display HTML tags as well e.g. <b> label gets bold */
    return(
        <>
        <Tooltip target={"#" + checkComponentName(props.name) + "-text"} />
        <span
            {...usePopupMenu(props)}
            id={checkComponentName(props.name)}
            className={concatClassnames(
                "rc-label",
                isHTML ? " rc-label-html" : "",
                props.eventMousePressed ? "mouse-pressed-event" : "",
                props.style
            )}
            style={{
                //When the label is html, flex direction is column va and ha alignments need to be swapped
                justifyContent: !isHTML ? lblAlignments.ha : lblAlignments.va,
                alignItems: !isHTML ? lblAlignments.va : lblAlignments.ha,
                ...lblTextAlignment,
                ...layoutStyle,
                ...compStyle
            }}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            <span 
                id={props.name + "-text"} 
                ref={labelRef} 
                dangerouslySetInnerHTML={{ __html: props.text as string }} 
                data-pr-tooltip={props.toolTipText} 
                data-pr-position="left" />
        </span>
        </>
    )
}
export default UILabel
