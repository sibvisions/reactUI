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

import React, { FC, useEffect, useLayoutEffect, useRef } from "react";
import { ToggleButton, ToggleButtonChangeParams, ToggleButtonIconPositionType } from 'primereact/togglebutton';
import tinycolor from 'tinycolor2';
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IButtonSelectable } from "../IButton";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages from "../../../hooks/event-hooks/useButtonMouseImages";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { IExtendableToggleButton } from "../../../extend-components/buttons/ExtendToggleButton";

/**
 * This component displays a Button which can be toggled on and off
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIToggleButton: FC<IButtonSelectable & IExtendableToggleButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle,, compStyle] = useComponentConstants<IButtonSelectable & IExtendableToggleButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, buttonRef.current ? buttonRef.current.container : undefined)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current.container : undefined);

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        if (props.onChange) {
            props.onChange(props.selected);
        }
    }, [props.selected, props.onChange])

    /** When the ToggleButton is pressed, send a pressButtonRequest to the server */
    const handleOnChange = (event:ToggleButtonChangeParams) => {
        if (props.onClick) {
            props.onClick(event.originalEvent);
        }

        const req = createDispatchActionRequest();
        req.componentId = props.name;
        showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
    }

    return (
        <span
            ref={buttonWrapperRef}
            style={layoutStyle}
            aria-label={props.ariaLabel}
            aria-pressed={props.ariaPressed}
        >
            <ToggleButton
                ref={buttonRef}
                id={props.name}
                className={concatClassnames(
                    "rc-togglebutton",
                    !btnStyle.borderPainted ? "border-notpainted" : '',
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    props.borderOnMouseEntered ? "mouse-border" : '',
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                    btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                    props.focusable === false ? "no-focus-rect" : "",
                    props.style
                )}
                style={{
                    ...btnStyle.style,
                    background: undefined,
                    borderColor: undefined,
                    '--btnJustify': btnStyle.style.justifyContent,
                    '--btnAlign': btnStyle.style.alignItems,
                    '--btnPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--selectedBackground': tinycolor(btnStyle.style.background?.toString()).darken(10).toString(),
                    '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                        '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                    } : {})
                }}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                onIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnStyle.iconPos as ToggleButtonIconPositionType}
                tabIndex={btnStyle.tabIndex}
                checked={props.selected}
                onChange={handleOnChange}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
            />
        </span>
    )
}
export default UIToggleButton