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
import { Checkbox } from 'primereact/checkbox';
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getAlignments } from "../../comp-props/GetAlignments";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { sendSetValues } from "../../../util/server-util/SendSetValues";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { handleEnterKey } from "../../../util/other-util/HandleEnterKey";
import { getFocusComponent } from "../../../util/html-util/GetFocusComponent";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { getTabIndex } from "../../../util/component-util/GetTabIndex";
import { IExtendableCheckboxEditor } from "../../../extend-components/editors/ExtendCheckboxEditor";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import { RenderButtonHTML } from "../../buttons/button/UIButton";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { IComponentConstants } from "../../BaseComponent";

/** Interface for cellEditor property of CheckBoxCellEditor */
export interface ICellEditorCheckBox extends ICellEditor {
    text?: string,
    selectedValue?:string|boolean|number,
    deselectedValue?:string|boolean|number
}

/** Interface for CheckBoxCellEditor */
export interface IEditorCheckBox extends IRCCellEditor {
    cellEditor: ICellEditorCheckBox
}

/**
 * The CheckBoxCellEditor displays a CheckBox and its label and edits its value in its databook
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorCheckBox: FC<IEditorCheckBox & IExtendableCheckboxEditor & IComponentConstants> = (props) => {
    /** Reference for the CheckBox element */
    const cbRef = useRef<any>(null);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Current state of wether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, cbRef.current ? cbRef.current.inputRef ? cbRef.current.inputRef.current : undefined : undefined, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && props.forwardedRef.current){
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    // Sets the background-color if cellFormatting is set in a cell-editor
    useLayoutEffect(() => {
        if (props.isCellEditor && props.forwardedRef.current) {
            if (props.cellFormatting && props.colIndex !== undefined && props.cellFormatting[props.colIndex]) {
                if (props.cellFormatting[props.colIndex].background) {
                    (props.forwardedRef.current.parentElement as HTMLElement).style.background = props.cellFormatting[props.colIndex].background as string
                }
            }
        }
    }, [props.cellFormatting])

    // Sets the checked value based on the selectedRow data
    useEffect(() => {
        setChecked(props.selectedRow ? props.selectedRow.data[props.columnName] : undefined);
    }, [props.selectedRow]);

    // If the lib user extends the CheckboxCellEditor with onChange, call it when slectedRow changes.
    useEffect(() => {
        if (props.onChange) {
            props.onChange({ 
                value: props.selectedRow ? props.selectedRow.data[props.columnName] : undefined, 
                selectedValue: props.cellEditor.selectedValue,
                deselectedValue: props.cellEditor.deselectedValue 
            });
        }
    }, [props.selectedRow, props.onChange])

    // Sends a setValues Request to the server when the checkbox is clicked
    const handleOnChange = () => {
        const doSendSetValues = () => {
            sendSetValues(
                props.dataRow,
                props.name,
                props.columnName,
                props.columnName,
                // If checked false, send selectedValue if there is one, if not send true, if checked send deselectedValue if there is one if not send false
                (checked !== props.cellEditor.selectedValue || !checked) ? 
                    props.cellEditor.selectedValue !== undefined ? 
                        props.cellEditor.selectedValue 
                    : 
                        true
                : 
                    props.cellEditor.deselectedValue !== undefined ? 
                        props.cellEditor.deselectedValue 
                    : 
                        false,
                props.context.server,
                props.topbar,
                props.rowIndex ? props.rowIndex() : undefined,
                props.selectedRow.index,
                props.filter ? props.filter() : undefined
            );
        }
        
        // Timeout of 1 in cell-editor so selectRecord gets called first
        if (props.isCellEditor) {
            setTimeout(() => {
                doSendSetValues()
            }, 1)
        }
        else {
            doSendSetValues()
        }
    }

    return (
        <span
            ref={props.forwardedRef}
            id={!props.isCellEditor ? props.name : undefined}
            aria-label={props.ariaLabel}
            className={concatClassnames(
                "rc-editor-checkbox",
                props.columnMetaData?.nullable === false ? "required-field" : "",
            )}
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
            onFocus={(event) => {
                if (props.eventFocusGained) {
                    onFocusGained(props.name, props.context.server);
                }
                else {
                    if (props.isCellEditor) {
                        event.preventDefault();
                    }
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, props.context.server) : undefined}
            onKeyDown={(event) => {
                event.preventDefault();
                handleEnterKey(event, event.target, props.name, props.stopCellEditing);
                if (event.key === " ") {
                    handleOnChange()
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
            <Checkbox
                inputId={id}
                ref={cbRef}
                trueValue={props.cellEditor.selectedValue}
                falseValue={props.cellEditor.deselectedValue}
                checked={checked}
                onChange={(event) => {
                    if (props.onClick) {
                        props.onClick(event.originalEvent);
                    }

                    handleOnChange()
                }}
                disabled={props.isReadOnly}
                tabIndex={props.isCellEditor ? -1 : getTabIndex(props.focusable, props.tabIndex)}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                className={props.focusable === false ? "no-focus-rect" : ""}
            />
            {!props.isCellEditor &&
                <label
                    className={concatClassnames(
                        "rc-editor-checkbox-label",
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
                    {isHTML && (props.cellEditor_text_ || props.cellEditor.text) ? <RenderButtonHTML text={props.cellEditor_text_ ? props.cellEditor_text_ as string : props.cellEditor.text as string} />
                    : props.cellEditor_text_ ? props.cellEditor_text_ : props.cellEditor?.text}
                </label>
            }

        </span>
    )
}
export default UIEditorCheckBox