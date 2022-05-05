import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Checkbox } from 'primereact/checkbox';
import { useMouseListener, usePopupMenu } from "../../../hooks";
import { ICellEditor } from "..";
import { sendSetValues, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, handleEnterKey, concatClassnames, getFocusComponent, getTabIndex } from "../../../util";
import { getAlignments } from "../../comp-props";
import { onFocusGained, onFocusLost } from "../../../util/server-util/SendFocusRequests";
import { IRCCellEditor } from "../CellEditorWrapper";

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
const UIEditorCheckBox: FC<IEditorCheckBox> = (props) => {
    /** Reference for the span that is wrapping the button containing layout information */
    const wrapRef = useRef<any>(null);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /** Hook for MouseListener */
    useMouseListener(props.name, wrapRef.current ? wrapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Current state of wether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(props.selectedRow ? props.selectedRow.data : undefined);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && wrapRef.current){
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

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
        setChecked(props.selectedRow ? props.selectedRow.data : undefined)
    }, [props.selectedRow]);

    // Sends a setValues Request to the server when the checkbox is clicked
    const handleOnChange = () => {
        sendSetValues(
            props.dataRow,
            props.name,
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
            undefined,
            props.topbar,
            props.rowIndex ? props.rowIndex() : undefined,
            props.selectedRow.index,
            props.filter ? props.filter() : undefined
        );
    }

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
                trueValue={props.cellEditor.selectedValue}
                falseValue={props.cellEditor.deselectedValue}
                checked={checked}
                onChange={() => handleOnChange()}
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
                        props.style
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
                    {props.cellEditor?.text}
                </label>
            }

        </span>
    )
}
export default UIEditorCheckBox