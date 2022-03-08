/** React imports */
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { Checkbox } from 'primereact/checkbox';

/** Hook imports */
import { useFetchMissingData, useMouseListener, usePopupMenu } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { sendSetValues, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, handleEnterKey, concatClassnames, getFocusComponent } from "../../util";
import { getAlignments } from "../../compprops";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

/** Interface for cellEditor property of CheckBoxCellEditor */
export interface ICellEditorCheckBox extends ICellEditor {
    text?: string,
    selectedValue?:string|boolean|number,
    deselectedValue?:string|boolean|number
}

/** Interface for CheckBoxCellEditor */
export interface IEditorCheckBox extends IEditor {
    cellEditor: ICellEditorCheckBox
}

/**
 * The CheckBoxCellEditor displays a CheckBox and its label and edits its value in its databook
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorCheckBox: FC<IEditorCheckBox> = (props) => {
    /** Reference for the span that is wrapping the button containing layout information */
    const wrapRef = useRef<any>(null);

    /** If the CellEditor is read-only */
    const isReadOnly = useMemo(() => (props.isCellEditor && props.readonly) || !props.cellEditor_editable_ || props.enabled === false, [props.isCellEditor, props.readonly, props.cellEditor_editable_, props.enabled]);

    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    useFetchMissingData(props.compId, props.dataRow);

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

    useEffect(() => {
        setChecked(props.selectedRow ? props.selectedRow.data : undefined)
    }, [props.selectedRow]);

    const handleOnChange = () => {
        sendSetValues(
            props.dataRow,
            props.name,
            props.columnName,
            checked !== props.cellEditor.selectedValue ? 
                props.cellEditor.selectedValue ? 
                    props.cellEditor.selectedValue 
                : 
                    true
            : 
                props.cellEditor.deselectedValue ? 
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
                        background: props.cellStyle?.background,
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
                disabled={isReadOnly}
                tabIndex={props.isCellEditor ? -1 : props.tabIndex ? props.tabIndex : 0}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
            />
            {!props.isCellEditor &&
                <label
                    className={concatClassnames(
                        "rc-editor-checkbox-label",
                        props.eventMousePressed ? "mouse-pressed-event" : ""
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