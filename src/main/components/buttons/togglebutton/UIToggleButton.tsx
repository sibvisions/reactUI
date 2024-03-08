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

import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ToggleButton, ToggleButtonChangeParams, ToggleButtonIconPositionType } from 'primereact/togglebutton';
import tinycolor from 'tinycolor2';
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
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
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { RenderButtonHTML, getButtonText, isCheckboxCellEditor } from "../button/UIButton";
import { IEditorCheckBox, getBooleanValueFromValue, handleCheckboxOnChange } from "../../editors/checkbox/UIEditorCheckbox";

/**
 * This component displays a Button which can be toggled on and off
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIToggleButton: FC<IButtonSelectable & IExtendableToggleButton | IEditorCheckBox> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IButtonSelectable & IExtendableToggleButton | IEditorCheckBox>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, buttonRef.current ? buttonRef.current.container : undefined)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current.container : undefined);

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, buttonRef.current ? buttonRef.current.container : undefined, context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates(props.text ? "default-button" : "icon-only-button");

    /** Adding HTML-text to button manually */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            if (isHTML) {
                if (buttonRef.current.container.classList.contains('p-button-icon-only')) {
                    buttonRef.current.container.classList.remove('p-button-icon-only');
                }
                buttonRef.current.container.querySelector('.p-button-label').innerHTML = getButtonText(props, baseProps);
            }
            else {
                if (!buttonRef.current.container.classList.contains('p-button-icon-only') && !getButtonText(props, baseProps)) {
                    buttonRef.current.container.classList.add('p-button-icon-only');
                }
            }
        }
    }, [isHTML, !isCheckboxCellEditor(props) ? props.selected : props.selectedRow ? props.selectedRow.data[props.columnName] : undefined])

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, isHTML]);

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        buttonWrapperRef.current,
        layoutStyle,
        (clone: HTMLElement) => sendOnLoadCallback(
            id,
            props.className,
            parsePrefSize(props.preferredSize),
            parseMaxSize(props.maximumSize),
            parseMinSize(props.minimumSize),
            clone,
            onLoadCallback
        ),
        onLoadCallback
    );

    //If lib-user extends Togglebutton with onChange, call it when selected changes
    useEffect(() => {
        if (!isCheckboxCellEditor(props)) {
            if (props.onChange) {
                props.onChange(props.selected);
            }
        }
    }, [!isCheckboxCellEditor(props) ? props.selected : undefined, !isCheckboxCellEditor(props) ? props.onChange : undefined])

    /** When the ToggleButton is pressed, send a pressButtonRequest to the server */
    const handleOnChange = (event:ToggleButtonChangeParams) => {
        if (!isCheckboxCellEditor(props)) {
            // if lib user extends onClick, call when clicking
            if (props.onClick) {
                props.onClick(event.originalEvent);
            }

            const req = createDispatchActionRequest();
            req.componentId = props.name;
            showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), context.server.topbar);
        }
        else if (isCheckboxCellEditor(baseProps)) {
            handleCheckboxOnChange(
                baseProps.name,
                baseProps.dataRow,
                baseProps.columnName,
                baseProps.selectedRow ? baseProps.selectedRow.data[baseProps.columnName] : false,
                baseProps.cellEditor.selectedValue,
                baseProps.cellEditor.deselectedValue,
                baseProps.context.server,
                baseProps.rowIndex,
                baseProps.selectedRow.index,
                baseProps.filter,
                baseProps.isCellEditor
            )
        }
    }

    const getChecked = () => {
        if (!isCheckboxCellEditor(props)) {
            return props.selected === undefined ? false : props.selected
        }
        else if (isCheckboxCellEditor(baseProps)) {
            if (baseProps.selectedRow) {
                return undefined;
            }
            else {
                if (baseProps.selectedRow.data[props.columnName] !== undefined) {
                    return getBooleanValueFromValue(baseProps.selectedRow.data[baseProps.columnName], baseProps.cellEditor.selectedValue);
                }
            }
        }
        return false;
    }

    return (
        <span
            ref={buttonWrapperRef}
            style={!props.id ? undefined: layoutStyle}
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
                    !isCheckboxCellEditor(props) ? (props as IButtonSelectable).borderOnMouseEntered ? "mouse-border" : "" : "",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                    btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                    props.focusable === false ? "no-focus-rect" : "",
                    styleClassNames,
                    isCompDisabled(props) ? "togglebutton-disabled" : ""
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
                        '--iconTextGap': `${!isCheckboxCellEditor(props) ? (props as IButtonSelectable).imageTextGap || 4 : 4}px`,
                        '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                    } : {})
                }}
                onLabel={!isHTML ? getButtonText(props, baseProps) : undefined}
                offLabel={!isHTML ? getButtonText(props, baseProps) : undefined}
                offIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                onIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnStyle.iconPos as ToggleButtonIconPositionType}
                tabIndex={btnStyle.tabIndex}
                checked={getChecked()}
                onChange={handleOnChange}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, context)}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}>
                    {isHTML && props.text && <RenderButtonHTML text={getButtonText(props, baseProps) || ""} />}
                </ToggleButton>
        </span>
    )
}
export default UIToggleButton