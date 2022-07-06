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

import React, { FC, useLayoutEffect, useRef } from "react";
import { Tooltip } from 'primereact/tooltip';
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import BaseComponent from "../../util/types/BaseComponent";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { getTabIndex } from "../../util/component-util/GetTabIndex";

// Interface for the browser component
export interface IBrowser extends BaseComponent {
    url: string;
}

/**
 * This component displays an iframe which displays an url
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIBrowser: FC<IBrowser> = (baseProps) => {
    /** Reference for the browser element */
    const browserRef = useRef<any>(null);

    /** Component constants for contexts, properties and style */
    const [context,, [props], layoutStyle,, compStyle] = useComponentConstants<IBrowser>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, browserRef.current ? browserRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = browserRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={browserRef} style={layoutStyle}>
            <Tooltip target={"#" + props.name} />
            <iframe
                id={props.name} 
                className={concatClassnames("rc-mobile-browser", props.style)}
                style={{...compStyle}}
                src={props.url}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIBrowser