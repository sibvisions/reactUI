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

import React, { FC, useLayoutEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import IBaseComponent from "../../util/types/IBaseComponent";
import { handleFocusGained, onFocusLost } from "../../util/server-util/FocusUtil";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../util/component-util/IsCompDisabled";
import { sendSetValue, sendAction } from "../../util/server-util/SendSetValues";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IExtendableText } from "../../extend-components/text/ExtendText";
import useRequestFocus from "../../hooks/event-hooks/useRequestFocus";
import { IComponentConstants } from "../BaseComponent";

/** Interface for Textfields */
export interface ITextField extends IBaseComponent, IComponentConstants {
    columns?:number
    editable?:boolean
}

/**
 * This component displays an input field not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIText: FC<ITextField & IExtendableText> = (props) => {
    /** Current state of the text value */
    const [text, setText] = useState(props.text || "");

    /** True, if the user has changed the value */
    const startedEditing = useRef<boolean>(false);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Reference for the input element */
    const inputRef = useRef<any>(null);

    /** Input timer to send text changes only all 300ms. */
    const inputTimer = useRef<NodeJS.Timeout | null>(null);
    
    /** Hook for requesting focus */
    useRequestFocus(id, props.requestFocus, inputRef.current, props.context);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.forwardedRef.current]);

    return (
        <span ref={props.forwardedRef} id={props.name} style={props.layoutStyle}>
            <InputText
                ref={inputRef}
                className={concatClassnames(
                    "rc-input",
                    props.focusable === false ? "no-focus-rect" : "",
                    isCompDisabled(props) ? "rc-input-readonly" : "",
                    props.styleClassNames
                )}
                value={text || ""}
                style={{ ...props.compStyle, width: "100%", height: "100%" }}
                onChange={event => {
                    startedEditing.current = true;
                    const newValue = event.currentTarget.value;

                    setText(newValue);

                    if (props.onChange) {
                        props.onChange({ originalEvent: event, value: newValue });
                    }

                    if (inputTimer.current) {
                       clearTimeout(inputTimer.current);
                    }
                    inputTimer.current = setTimeout(() => {
                        inputTimer.current = null;
                        sendSetValue(props.name, newValue, props.context.server, props.topbar);
                    }, 300);
                }}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
                onBlur={(event) => {
                    if (!isCompDisabled(props)) {
                        if (props.onBlur) {
                            props.onBlur(event);
                        }

                        if (startedEditing.current) {
                            startedEditing.current = false;
                            if (inputTimer.current) {
                                clearTimeout(inputTimer.current);
                            }
                            sendAction(props.name, text, "FOCUS_LOST", props.context.server, props.topbar);
                        }

                        if (props.eventFocusLost) {
                            onFocusLost(props.name, props.context.server)
                        }
                    }
                }}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left", showDelay: 800 }}
                {...usePopupMenu(props)}
                size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();

                        if (startedEditing.current) {
                            startedEditing.current = false;
                            if (inputTimer.current) {
                                clearTimeout(inputTimer.current);
                            }
                            sendAction(props.name, text, event.shiftKey ? "SHIFT_ENTER_KEY" : "ENTER_KEY", props.context.server, props.topbar);
                        }
                    }
                }}
                disabled={isCompDisabled(props)}
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIText