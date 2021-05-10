/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";

/** Hook imports */
import { useProperties, useRowSelect } from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId, 
         getMetaData, 
         sendSetValues, 
         handleEnterKey, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize } from "../../util";

/** Interface for cellEditor property of TextCellEditor */
interface ICellEditorText extends ICellEditor {
    length?:number
}

/** Interface for TextCellEditor */
export interface IEditorText extends IEditor {
    cellEditor: ICellEditorText
    borderVisible?: boolean
}

/**
 * TextCellEditor is an inputfield which allows to enter text. Based on the contentType the server sends it is decided wether
 * the CellEditor becomes a normal texteditor, a textarea or a passwor field, when the value is changed the databook on the server is changed
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorText: FC<IEditorText> = (baseProps) => {
    /** Reference for the TextCellEditor element */
    const textRef = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Current state value of input element */
    const [text, setText] = useState(selectedRow);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** The metadata for the TextCellEditor */
    const cellEditorMetaData:IEditorText|undefined = getMetaData(compId, props.dataRow, context.contentStore)?.columns.find(column => column.name === props.columnName) as IEditorText;
    /** Returns the maximum length for the TextCellEditor */
    const length = useMemo(() => cellEditorMetaData?.cellEditor.length, [cellEditorMetaData]);
    /** The horizontal- and vertical alignments */
    const textAlign = useMemo(() => getTextAlignment(props), [props]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout, password ref has a inconsistency */
    useLayoutEffect(() => {
        if(onLoadCallback && textRef.current) {
            if (props.cellEditor.contentType?.includes("password")) {
                //@ts-ignore
                sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), textRef.current, onLoadCallback)
            }
            else {
                // @ts-ignore
                sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), textRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, props.cellEditor.contentType, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    /** Return either a textarea, password or normal textfield based on server sent contentType */
    if (props.cellEditor.contentType?.includes("multiline")) {
        return (
            <InputTextarea
            autoFocus={baseProps.autoFocus}
            ref={textRef}
            className="rc-editor-textarea"
            style={layoutValue.get(props.id) ? 
                {...layoutValue.get(props.id), ...textAlign, background: props.cellEditor_background_} : 
                {...baseProps.editorStyle, ...textAlign, background: props.cellEditor_background_}}
            maxLength={length}
            disabled={!props.cellEditor_editable_}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
            onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
        />
        )
    }
    else if (props.cellEditor.contentType?.includes("password")) {
        return (
            <Password
            autoFocus={baseProps.autoFocus}
            inputRef={textRef}
            className="rc-editor-password"
            style={layoutValue.get(props.id) ? 
                {...layoutValue.get(props.id), ...textAlign, background: props.cellEditor_background_} : 
                {...baseProps.editorStyle, ...textAlign, background: props.cellEditor_background_}}
            maxLength={length}
            feedback={false}
            disabled={!props.cellEditor_editable_}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
            onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
        />
        )
    }
    else {
        return(
            <InputText
                autoFocus={baseProps.autoFocus}
                ref={textRef}
                className={"rc-editor-text" + (props.borderVisible === false ? " invisible-border" : "")}
                style={layoutValue.get(props.id) ? 
                        {...layoutValue.get(props.id), ...textAlign, background: props.cellEditor_background_} : 
                        {...baseProps.editorStyle, ...textAlign, background: props.cellEditor_background_}}
                maxLength={length}
                disabled={!props.cellEditor_editable_}
                value={text || ""}
                onChange={event => setText(event.currentTarget.value)}
                onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
                onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, context.server))}
            />
        )
    }
}
export default UIEditorText