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
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IRCCellEditor } from "../CellEditorWrapper";
import { ICellEditor } from "../IEditor";
import { getAlignments } from "../../comp-props/GetAlignments";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
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
import useDesignerUpdates from "../../../hooks/style-hooks/useDesignerUpdates";
import useHandleDesignerUpdate from "../../../hooks/style-hooks/useHandleDesignerUpdate";
import { RenderButtonHTML } from "../../buttons/button/UIButton";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import { createSelectRowRequest } from "../../../factories/RequestFactory";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { showTopBar } from "../../topbar/TopBar";
import ServerFull from "../../../server/ServerFull";
import Server from "../../../server/Server";
import { SelectFilter } from "../../../request/data/SelectRowRequest";

/** Interface for cellEditor property of CheckBoxCellEditor */
export interface ICellEditorCheckBox extends ICellEditor {
    text?: string,
    selectedValue?:string|boolean|number,
    deselectedValue?:string|boolean|number,
    imageName?: string
}

/** Interface for CheckBoxCellEditor */
export interface IEditorCheckBox extends IRCCellEditor {
    cellEditor: ICellEditorCheckBox
}

/**
 * Returns true, if the given value is the selectedValue of the celleditor
 * @param value - the value of the field
 */
export const getBooleanValueFromValue = (value: any, selectedValue: any) => {
    if (value === selectedValue) {
        return true;
    }
    return false;
}

/**
 * Sends a setValues Request to the server when the checkbox is clicked
 * @param name - the name of the editor
 * @param dataRow - the datarow of the editor
 * @param columnName - the columnName of the editor
 * @param selected - true, if the checkbox is currently selected
 * @param selectedValue - the selectedValue of the checkbox
 * @param deselectedValue - the deselectedValue of the checkbox
 * @param server - the server instance
 * @param rowIndex - the function to get the rowindex
 * @param selectedRowIndex - the currently selected row index
 * @param filter - a possible filter so send
 * @param isCellEditor - true, if the editor is a celleditor
 */
export const handleCheckboxOnChange = (
    name: string, 
    dataRow: string, 
    columnName: string, 
    selected: boolean|any, 
    selectedValue: any, 
    deselectedValue: any,
    server: Server|ServerFull,
    rowIndex?: Function,
    selectedRowIndex?: number,
    filter?: SelectFilter,
    isCellEditor?: boolean

) => {
    const doSendSetValues = () => {
        sendSetValues(
            dataRow,
            name,
            columnName,
            columnName,
            // If checked false, send selectedValue if there is one, if not send true, if checked send deselectedValue if there is one if not send false
            (typeof selected === "boolean" ? !selected : deselectedValue !== undefined ? deselectedValue === selected : selected === false) ? 
                selectedValue !== undefined ? 
                    selectedValue 
                : 
                    true
            : 
                deselectedValue !== undefined ? 
                    deselectedValue 
                : 
                    false,
            server,
            server.topbar,
            rowIndex ? rowIndex() : undefined,
            selectedRowIndex,
            filter ? filter : undefined
        );
    }
    
    if (isCellEditor) {
        const selectReq = createSelectRowRequest();
        selectReq.dataProvider = dataRow;
        selectReq.componentId = name;
        selectReq.rowNumber = rowIndex ? rowIndex() : undefined;
        selectReq.selectedColumn = columnName;
        selectReq.filter = filter ? filter : undefined;
        showTopBar(server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_ROW), server.topbar);
        doSendSetValues()
    }
    else {
        doSendSetValues()
    }
}

/**
 * The CheckBoxCellEditor displays a CheckBox and its label and edits its value in its databook
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorCheckBox: FC<IEditorCheckBox & IExtendableCheckboxEditor> = (props) => {
    /** Reference for the span that is wrapping the button containing layout information */
    const wrapRef = useRef<any>(null);

    /** Reference for the CheckBox element */
    const cbRef = useRef<any>(null);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Current state of wether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(props.selectedRow ? getBooleanValueFromValue(props.selectedRow.data[props.columnName], props.cellEditor.selectedValue) : false);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** Handles the requestFocus property */
    useRequestFocus(id, props.requestFocus, cbRef.current ? cbRef.current.inputRef ? cbRef.current.inputRef.current : undefined : undefined, props.context);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(props.text);

    /** Subscribes to designer-changes so the components are updated live */
    const designerUpdate = useDesignerUpdates("checkbox");

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && wrapRef.current){
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, designerUpdate]);

    /** Retriggers the size-measuring and sets the layoutstyle to the component */
    useHandleDesignerUpdate(
        designerUpdate,
        wrapRef.current,
        props.layoutStyle,
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

    // Sets the background-color if cellFormatting is set in a cell-editor
    useLayoutEffect(() => {
        if (props.isCellEditor && wrapRef.current) {
            if (props.cellFormatting && props.colIndex !== undefined && props.cellFormatting[props.colIndex]) {
                if (props.cellFormatting[props.colIndex].background) {
                    (wrapRef.current.parentElement as HTMLElement).style.background = props.cellFormatting[props.colIndex].background as string
                }
            }
        }
    }, [props.cellFormatting])

    // Sets the checked value based on the selectedRow data
    useEffect(() => {
        setChecked(props.selectedRow ? getBooleanValueFromValue(props.selectedRow.data[props.columnName], props.cellEditor.selectedValue) : false);
    }, [props.selectedRow, props.cellEditor.selectedValue]);

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

    return (
        <span
            ref={wrapRef}
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
            <Checkbox
                inputId={id}
                ref={cbRef}
                checked={checked}
                onChange={(event) => {
                    if (props.onClick) {
                        props.onClick(event.originalEvent);
                    }

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