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
import { RadioButton, RadioButtonChangeParams } from 'primereact/radiobutton';
import tinycolor from 'tinycolor2';
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IButtonSelectable } from "../IButton";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { sendSetValue } from "../../../util/server-util/SendSetValues";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import { IExtendableSelectable } from "../../../extend-components/buttons/ExtendCheckbox";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import { RenderButtonHTML, getButtonText, isCheckboxCellEditor } from "../button/UIButton";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { IEditorCheckBox, getBooleanValueFromValue, handleCheckboxOnChange } from "../../editors/checkbox/UIEditorCheckbox";

/**
 * This component displays a RadioButton and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIRadioButton: FC<IButtonSelectable & IExtendableSelectable | IEditorCheckBox> = (baseProps) => {
    /** Reference for the RadioButton element */
    const rbRef = useRef<any>(null)

    /** Reference for label element of RadioButton */
    const labelRef = useRef<any>(null);

    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants for contexts, properties and style */
    const [context, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IButtonSelectable & IExtendableSelectable | IEditorCheckBox>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle, compStyle, labelRef.current, rbRef.current ? rbRef.current.element : undefined);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, rbRef.current ? rbRef.current.inputRef ? rbRef.current.inputRef.current : undefined : undefined, context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates("radiobutton");

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, compStyle, designerUpdate]);

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

    //If lib-user extends Radiobutton with onChange, call it when selected changes
    useEffect(() => {
        if (!isCheckboxCellEditor(props)) {
            if (props.onChange) {
                props.onChange(props.selected === undefined ? true : !props.selected);
            }
        }
    }, [!isCheckboxCellEditor(props) ? props.selected : undefined])

    //If lib-user extends Radiobutton with onClick, call it when the Radiobutton is clicked
    const onClick = (event:RadioButtonChangeParams) => {
        if (!isCheckboxCellEditor(props)) {
            if (props.onClick) {
                props.onClick(event.originalEvent);
            }
            sendSetValue(props.name, props.selected === undefined ? true : !props.selected, context.server, context.server.topbar)
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

    /** Returns true, if the radiobutton is checked */
    const getChecked = () => {
        if (!isCheckboxCellEditor(props)) {
            return props.selected === undefined ? false : props.selected
        }
        else if (isCheckboxCellEditor(baseProps)) {
            return baseProps.selectedRow ? getBooleanValueFromValue(baseProps.selectedRow.data[baseProps.columnName], baseProps.cellEditor.selectedValue) : false;
        }
    }
    

    return (
        <span ref={buttonWrapperRef} style={!props.id ? undefined : layoutStyle}>
            <span
                id={props.name}
                aria-label={props.ariaLabel}
                className={concatClassnames(
                    "rc-radiobutton",
                    `gap-${btnStyle.iconGapPos}`,
                    btnStyle.iconDirection,
                    styleClassNames
                    )}
                onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, context)}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                style={{
                    ...btnStyle.style,
                    '--radioJustify': btnStyle.style.justifyContent, 
                    '--radioAlign': btnStyle.style.alignItems,
                    '--radioPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--iconTextGap': `${!isCheckboxCellEditor(props) ? (props as IButtonSelectable).imageTextGap || 4 : 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`,
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    } : {})
                } as any}>
                <RadioButton
                    ref={rbRef}
                    inputId={props.id}
                    style={{ order: btnStyle.iconPos === 'left' ? 1 : 2 }}
                    checked={getChecked()}
                    onChange={onClick}
                    tooltip={props.toolTipText}
                    tooltipOptions={{ position: "left" }}
                    disabled={!isCheckboxCellEditor(props) ? isCompDisabled(props) : isCheckboxCellEditor(baseProps) ? baseProps.isReadOnly : undefined}
                    tabIndex={btnStyle.tabIndex}
                    className={props.focusable === false ? "no-focus-rect" : ""}
                />
                {(!isCheckboxCellEditor(props) || (isCheckboxCellEditor(baseProps) && !baseProps.isCellEditor)) && <label 
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
                    {isHTML && props.text ? <RenderButtonHTML text={getButtonText(props, baseProps) || ""} /> : getButtonText(props, baseProps)}
                </label>}
            </span>
        </span>
    )
}
export default UIRadioButton