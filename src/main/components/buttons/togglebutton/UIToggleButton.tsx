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

import React, { CSSProperties, FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ToggleButton, ToggleButtonChangeEvent } from 'primereact/togglebutton';
import tinycolor from 'tinycolor2';
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IButtonSelectable } from "../IButton";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages from "../../../hooks/event-hooks/useButtonMouseImages";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { IExtendableToggleButton } from "../../../extend-components/buttons/ExtendToggleButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { RenderButtonHTML, getButtonText, isCheckboxCellEditor } from "../button/UIButton";
import { IEditorCheckBox, getBooleanValueFromValue, handleCheckboxOnChange } from "../../editors/checkbox/UIEditorCheckbox";
import { IComponentConstants } from "../../BaseComponent";

/**
 * This component displays a Button which can be toggled on and off
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIToggleButton: FC<IButtonSelectable & IExtendableToggleButton | IEditorCheckBox & IComponentConstants> = (props) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, buttonRef.current ? buttonRef.current.getElement() : undefined)

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, buttonRef.current ? buttonRef.current.getElement() : undefined);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, buttonRef.current ? buttonRef.current.getElement() : undefined, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(getButtonText(props));

    /** Adding HTML-text to button manually */
    useLayoutEffect(() => {
        if (buttonRef.current) {
            if (isHTML) {
                if (buttonRef.current.getElement().classList.contains('p-button-icon-only')) {
                    buttonRef.current.getElement().classList.remove('p-button-icon-only');
                }
                buttonRef.current.getElement().querySelector('.p-button-label').innerHTML = getButtonText(props);
            }
            else {
                if (!buttonRef.current.getElement().classList.contains('p-button-icon-only') && !getButtonText(props)) {
                    buttonRef.current.getElement().classList.add('p-button-icon-only');
                }
            }
        }
    }, [isHTML, !isCheckboxCellEditor(props) ? props.selected : props.selectedRow ? props.selectedRow.data[props.columnName] : undefined]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, isHTML, props.designerUpdate]);

    //If lib-user extends Togglebutton with onChange, call it when selected changes
    useEffect(() => {
        if (!isCheckboxCellEditor(props)) {
            if (props.onChange) {
                props.onChange(props.selected);
            }
        }
    }, [!isCheckboxCellEditor(props) ? props.selected : undefined, !isCheckboxCellEditor(props) ? props.onChange : undefined])

    /** When the ToggleButton is pressed, send a pressButtonRequest to the server */
    const handleOnChange = (event:ToggleButtonChangeEvent) => {
        if (!isCheckboxCellEditor(props)) {
            // if lib user extends onClick, call when clicking
            if (props.onClick) {
                props.onClick(event.originalEvent);
            }

            const req = createDispatchActionRequest();
            req.componentId = props.name;
            showTopBar(props.context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), props.topbar);
        }
        else {
            handleCheckboxOnChange(
                props.name,
                props.dataRow,
                props.columnName,
                props.selectedRow ? props.selectedRow.data[props.columnName] : false,
                props.cellEditor.selectedValue,
                props.cellEditor.deselectedValue,
                props.context.server,
                props.rowIndex,
                props.selectedRow.index,
                props.filter,
                props.isCellEditor
            )
        }
    }

    const getChecked = () => {
        if (!isCheckboxCellEditor(props)) {
            return props.selected === undefined ? false : props.selected
        }
        else {
            if (!props.selectedRow) {
                return undefined;
            }
            else {
                if (props.selectedRow.data[props.columnName] !== undefined) {
                    return getBooleanValueFromValue(props.selectedRow.data[props.columnName], props.cellEditor.selectedValue);
                }
            }
        }
        return false;
    }

    return (
        <span
            ref={props.forwardedRef}
            id={props.name}
            style={!props.id ? undefined : props.layoutStyle}
            aria-label={props.ariaLabel}
            aria-pressed={props.ariaPressed}
        >
            <ToggleButton
                ref={buttonRef}
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
                    props.styleClassNames,
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
                        '--iconImage': `url(${props.context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${!isCheckboxCellEditor(props) ? (props as IButtonSelectable).imageTextGap || 4 : 4}px`,
                        '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                    } : {})
                } as CSSProperties}
                onLabel={!isHTML ? getButtonText(props) : undefined}
                offLabel={!isHTML ? getButtonText(props) : undefined}
                offIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                onIcon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                iconPos={btnStyle.iconPos}
                tabIndex={btnStyle.tabIndex}
                checked={getChecked()}
                onChange={handleOnChange}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}>
                    {isHTML && props.text && <RenderButtonHTML text={getButtonText(props) || ""} />}
                </ToggleButton>
        </span>
    )
}
export default UIToggleButton