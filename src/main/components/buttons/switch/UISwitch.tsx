/* Copyright 2024 SIB Visions GmbH
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
import { InputSwitch } from "primereact/inputswitch";
import { IEditorCheckBox, getBooleanValueFromValue, handleCheckboxOnChange } from "../../editors/checkbox/UIEditorCheckbox";
import { IComponentConstants } from "../../BaseComponent";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { getAlignments } from "../../comp-props/GetAlignments";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { getFocusComponent } from "../../../util/html-util/GetFocusComponent";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { RenderButtonHTML, getButtonText } from "../button/UIButton";

/** This component displays a switch, used when the CheckboxCellEditor style 'ui-switch' is used */
const UISwitch: FC<IEditorCheckBox & IComponentConstants> = (props) => {
    /** Reference for the switch component */
    const switchRef = useRef<any>();

    /** Current state of whether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(props.selectedRow ? getBooleanValueFromValue(props.selectedRow.data[props.columnName], props.cellEditor.selectedValue) : false);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Extracting onLoadCallback and id from props */
    const { onLoadCallback, id } = props;

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(getButtonText(props));

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && props.forwardedRef.current) {
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    // Sets the checked value based on the selectedRow data
    useEffect(() => {
        setChecked(props.selectedRow ? getBooleanValueFromValue(props.selectedRow.data[props.columnName], props.cellEditor.selectedValue) : false);
    }, [props.selectedRow, props.cellEditor.selectedValue]);

    return (
        <span
            id={props.name}
            ref={props.forwardedRef}
            style={
                props.isCellEditor ?
                    { justifyContent: alignments.ha, alignItems: alignments.va }
                    :
                    {
                        ...props.layoutStyle,
                        //background: props.cellStyle?.background,
                        justifyContent: alignments?.ha,
                        alignItems: alignments?.va
                    }}
            className="rc-switch"
            onFocus={(event) => handleFocusGained(props.name, props.cellEditor.className, props.eventFocusGained, props.focusable, event, props.name, props.context, props.isCellEditor)}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            onKeyDown={(event) => {
                event.preventDefault();
                handleEnterKey(event, event.target, props.name, props.stopCellEditing);
                if (event.key === " ") {
                    handleCheckboxOnChange(
                        props.name,
                        props.dataRow,
                        props.columnName,
                        checked,
                        props.cellEditor.selectedValue,
                        props.cellEditor.deselectedValue,
                        props.context.server,
                        props.rowIndex,
                        props.selectedRow.index,
                        props.filter,
                        props.isCellEditor
                    )
                }
                if (event.key === "Tab") {
                    if (props.isCellEditor && props.stopCellEditing) {
                        props.stopCellEditing(event)
                    }
                    else {
                        if (event.shiftKey) {
                            getFocusComponent(props.name, false)?.focus();
                        }
                        else {
                            getFocusComponent(props.name, true)?.focus();
                        }
                    }
                }
            }}
            {...usePopupMenu(props)} >
            <InputSwitch
                inputId={id}
                ref={switchRef}
                checked={checked}
                onChange={(e) => {
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
                }}
                disabled={props.isReadOnly}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                className={props.focusable === false ? "no-focus-rect" : ""} />
            {!props.isCellEditor &&
                <label
                    className={concatClassnames(
                        "rc-switch-label",
                        props.eventMousePressed ? "mouse-pressed-event" : "",
                        props.styleClassNames
                    )}
                    style={{
                        caretColor: "transparent",
                        color: props.cellStyle?.color,
                        fontFamily: props.cellStyle?.fontFamily,
                        fontWeight: props.cellStyle?.fontWeight,
                        fontStyle: props.cellStyle?.fontStyle,
                        fontSize: props.cellStyle?.fontSize
                    }}
                    htmlFor={id}>
                    {isHTML && (props.cellEditor_text_ || props.cellEditor.text) ? <RenderButtonHTML text={getButtonText(props)} />
                        : getButtonText(props)}
                </label>
            }
        </span>
    )
}
export default UISwitch