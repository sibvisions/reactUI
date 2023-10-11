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

import React, { FC, useLayoutEffect } from "react";
import { Tooltip } from 'primereact/tooltip';
import IBaseComponent from "../../util/types/IBaseComponent";
import { handleFocusGained, onFocusLost } from "../../util/server-util/FocusUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IComponentConstants } from "../BaseComponent";

// Interface for the browser component
export interface IBrowser extends IBaseComponent, IComponentConstants {
    url: string;
}

/**
 * This component displays an iframe which displays an url
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIBrowser: FC<IBrowser> = (props) => {
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = props.forwardedRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span id={props.name} ref={props.forwardedRef} style={props.layoutStyle}>
            <Tooltip target={"#" + props.name} />
            <iframe
                className={concatClassnames("rc-mobile-browser", props.styleClassNames)}
                style={{...props.compStyle}}
                src={props.url}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIBrowser