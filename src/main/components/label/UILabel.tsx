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

import React, { FC, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Tooltip } from 'primereact/tooltip';
import BaseComponent from "../../util/types/BaseComponent";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import { getAlignments, translateTextAlign } from "../comp-props/GetAlignments";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";

import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IExtendableLabel } from "../../extend-components/label/ExtendLabel";
import useIsHTMLText from "../../hooks/components-hooks/useIsHTMLText";
import useAddLayoutStyle from "../../hooks/style-hooks/useAddLayoutStyle";

/**
 * Displays a simple label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UILabel: FC<BaseComponent & IExtendableLabel> = (baseProps) => {
    const wrapRef = useRef<HTMLSpanElement>(null);
    /** Reference for label element */
    const labelRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [,, [props], layoutStyle, compStyle] = useComponentConstants<BaseComponent & IExtendableLabel>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Alignments for label */
    const lblAlignments = getAlignments(props);

    /** The text-alignment of the label */
    const lblTextAlignment = translateTextAlign(props.horizontalAlignment);

    /** True, if the label contains html */
    const isHTML = useIsHTMLText(props.text);

    /** Hook for MouseListener */
    useMouseListener(props.name, labelRef.current ? labelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /**
     * XXX prevents infinite loop of labels, labels would report their size for a specific layoutstyle and then would report themselves again for adjusted parent -> loop
     * when there is already a size for this layoutstyle, don't report again and use this one instead.
     */
    //const layoutStyleSizes = useRef<Map<string, {width: any, height: any}>>(new Map<string, {width: any, height: any}>())

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (labelRef.current && onLoadCallback) {
            // if (layoutStyle && layoutStyle.width && layoutStyle.height) {
            //     if (layoutStyleSizes.current && !layoutStyleSizes.current.has(layoutStyle.width.toString() + "-" + layoutStyle.height.toString())) {
            //         sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback);
            //         layoutStyleSizes.current.set(layoutStyle.width.toString() + "-" + layoutStyle.height.toString(), { width: layoutStyle.width, height: layoutStyle.height });
            //     }
            // }
            // else {
                sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback);
            //}
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, layoutStyle?.width, layoutStyle?.height]);

    // If the lib user extends the label with onChange, call it when the label-text changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.text)
        }
    }, [props.text]);

    useAddLayoutStyle(wrapRef.current, layoutStyle, onLoadCallback, props.text);

    /** DangerouslySetInnerHTML because a label should display HTML tags as well e.g. <b> label gets bold */
    return(
        <>
        <Tooltip target={"#" + props.name + "-text"} />
        <span
            {...usePopupMenu(props)}
            ref={wrapRef}
            id={props.name}
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
                ...compStyle,
                //height: layoutStyle && layoutStyle.height && layoutStyle.width ? layoutStyleSizes.current.has(layoutStyle.width.toString() + "-" + layoutStyle.height.toString()) ? layoutStyleSizes.current.get(layoutStyle.width.toString() + "-" + layoutStyle.height.toString())!.height : layoutStyle.height : undefined,
                //width: layoutStyle && layoutStyle.height && layoutStyle.width ? layoutStyleSizes.current.has(layoutStyle.width.toString() + "-" + layoutStyle.height.toString()) ? layoutStyleSizes.current.get(layoutStyle.width.toString() + "-" + layoutStyle.height.toString())!.width : layoutStyle.width : undefined
            }}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            <span 
                id={props.name + "-text"} 
                ref={labelRef} 
                dangerouslySetInnerHTML={{ __html: props.text as string }} 
                data-pr-tooltip={props.toolTipText} 
                data-pr-position="left"
                layoutstyle-wrapper={props.name} />
        </span>
        </>
    )
}
export default UILabel
