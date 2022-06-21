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
import { Checkbox } from 'primereact/checkbox';
import tinycolor from 'tinycolor2';
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IButtonSelectable } from "../IButton";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { checkComponentName } from "../../../util/component-util/CheckComponentName";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { sendSetValue } from "../../../util/server-util/SendSetValues";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";

/**
 * This component displays a CheckBox and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UICheckBox: FC<IButtonSelectable> = (baseProps) => {
    /** Reference for the CheckBox element */
    const cbRef = useRef<any>(null);

    /** Reference for label element of CheckBox */
    const labelRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle,, compStyle] = useComponentConstants<IButtonSelectable>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, labelRef.current, cbRef.current ? cbRef.current.element : undefined);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);
    
    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const btnRef = buttonWrapperRef.current;
        if (btnRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), btnRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, compStyle]);

    return (
        <span ref={buttonWrapperRef} style={layoutStyle}>
            <span
                id={checkComponentName(props.name)}
                aria-label={props.ariaLabel}
                className={concatClassnames(
                    "rc-checkbox",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.style
                )}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                style={{
                    ...btnStyle.style,
                    '--checkJustify': btnStyle.style.justifyContent, 
                    '--checkAlign': btnStyle.style.alignItems,
                    '--checkPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--iconTextGap': `${props.imageTextGap || 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`,
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    } : {})
                } as any}>
                <Checkbox
                    ref={cbRef}
                    inputId={props.id}
                    style={{ order: btnStyle.iconPos === 'left' ? 1 : 2 }}
                    checked={props.selected}
                    onChange={() => sendSetValue(props.name, props.selected === undefined ? true : !props.selected, context.server, undefined, topbar)}
                    tooltip={props.toolTipText}
                    tooltipOptions={{ position: "left" }}
                    disabled={isCompDisabled(props)}
                    tabIndex={btnStyle.tabIndex}
                    className={props.focusable === false ? "no-focus-rect" : ""}
                />
                <label 
                    ref={labelRef} 
                    className={concatClassnames(
                        "p-radiobutton-label",
                        btnStyle.style.color ? 'textcolor-set' : '',
                        btnStyle.style.background !== "transparent" 
                        ? 
                            btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() 
                            ? 
                                "bright-button" 
                            : 
                                "dark-button"
                        :
                            "",
                        props.eventMousePressed ? "mouse-pressed-event" : ""
                    )}
                    htmlFor={props.id} 
                    style={{ order: btnStyle.iconPos === 'left' ? 2 : 1, caretColor: "transparent" }}>
                    {btnStyle.iconProps.icon !== undefined &&
                        <i className={concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon')}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UICheckBox