/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";
import { Editor } from "primereact/editor";

/** Hook imports */
import { useFetchMissingData, useLayoutValue, useMouseListener, useProperties, useRowSelect } from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
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
import { LengthBasedColumnDescription } from "../../../response";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";
import { getColMetaData } from "../../table/UITable";

/** Interface for TextCellEditor */
export interface IEditorText extends IEditor {
    cellEditor: ICellEditor
    borderVisible?: boolean
    length:number
}

enum FieldTypes {
    TEXTFIELD = 0,
    TEXTAREA = 1,
    PASSWORD = 2,
    HTML = 3
}

/**
 * TextCellEditor is an inputfield which allows to enter text. Based on the contentType the server sends it is decided wether
 * the CellEditor becomes a normal texteditor, a textarea or a passwor field, when the value is changed the databook on the server is changed
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorText: FC<IEditorText> = (baseProps) => {
    /** Reference for the TextCellEditor element */
    const textRef = useRef<any>();

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, baseProps.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Current state value of input element */
    const [text, setText] = useState(selectedRow);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id, name, stopCellEditing, dataRow, columnName} = props;

    /** The metaData of the dataRow */
    const metaData = getMetaData(compId, props.dataRow, context.contentStore)

    /** The metadata for the TextCellEditor */
    const cellEditorMetaData:LengthBasedColumnDescription = getColMetaData(props.columnName, metaData) as LengthBasedColumnDescription;

    /** Returns the maximum length for the TextCellEditor */
    const length = useMemo(() => cellEditorMetaData?.length, [cellEditorMetaData]);

    /** The horizontal- and vertical alignments */
    const textAlign = useMemo(() => getTextAlignment(props), [props]);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    /** Reference if escape has been pressed */
    const escapePressed = useRef<boolean>(false)

    const [showSource, setShowSource] = useState<boolean>(false);

    useFetchMissingData(compId, props.dataRow);

    /** Hook for MouseListener */
    useMouseListener(props.name, textRef.current ? textRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const getFieldType = useCallback(() => {
        const contentType = props.cellEditor.contentType
        if (contentType?.includes("multiline")) {
            return FieldTypes.TEXTAREA;
        }
        else if (contentType?.includes("password")) {
            return FieldTypes.PASSWORD;
        } 
        else if (contentType === 'text/html') {
            return FieldTypes.HTML;
        }
        else {
            return FieldTypes.TEXTFIELD;
        }
    }, [props.cellEditor.contentType])

    const fieldType = useMemo(() => getFieldType(), [getFieldType]) 

    const getClassName = (fieldType:FieldTypes) => {
        if (fieldType === FieldTypes.TEXTAREA) {
            return "rc-editor-textarea";
        }
        else if (fieldType === FieldTypes.PASSWORD) {
            return "rc-editor-password";
        }
        else if (fieldType === FieldTypes.HTML) {
            return "rc-editor-html";
        }
        else {
            return "rc-editor-text";
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout, password ref has a inconsistency */
    useLayoutEffect(() => {
        if(onLoadCallback && textRef.current) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), textRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.cellEditor.contentType, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    useEffect(() => {
        if (isCellEditor && props.passedKey) {
            setText("");
        }
    }, [])

    const tfOnKeyDown = useCallback((event:any) => {
        event.stopPropagation();
        handleEnterKey(event, event.target, name, stopCellEditing);
        if (isCellEditor && stopCellEditing) {
            if (event.key === "Tab") {
                (event.target as HTMLElement).blur();
                stopCellEditing(event);
            }
            else if (event.key === "Escape") {
                escapePressed.current = true;
                stopCellEditing(event);
            }
        }
    }, [name, stopCellEditing, isCellEditor]);

    const taOnKeyDown = useCallback((event:any) => {
        event.stopPropagation();
        if (event.key === "Enter" && event.shiftKey) {
            handleEnterKey(event, event.target, name, stopCellEditing);
        }
        if (isCellEditor && stopCellEditing) {
            if (event.key === "Tab") {
                (event.target as HTMLElement).blur();
                stopCellEditing(event);
            }
            else if (event.key === "Escape") {
                escapePressed.current = true;
                stopCellEditing(event);
            }
        }
    },[name, stopCellEditing, isCellEditor])

    const pwOnKeyDown = useCallback((event:any) => {
        event.stopPropagation();
        if (isCellEditor && stopCellEditing) {
            if (event.key === "Enter" || event.key === "Tab") {
                onBlurCallback(baseProps, text, lastValue.current, () => showTopBar(sendSetValues(dataRow, name, columnName, text, context.server), topbar));
                stopCellEditing(event);
            }
            else if (event.key === "Escape") {
                escapePressed.current = true;
                stopCellEditing(event);
            }
        }
    }, [baseProps, stopCellEditing, dataRow, columnName, name, text, isCellEditor, context.server]);

    const disabled = !props.cellEditor_editable_;

    const primeProps: any = useMemo(() => {
        return fieldType === FieldTypes.HTML ? {
            onTextChange: showSource || disabled ? () => {} : (value: any) => setText(value.htmlValue),
            value: text || "",
            headerTemplate: (
                <>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <select className="ql-size">
                        <option value="small"></option>
                        <option selected></option>
                        <option value="large"></option>
                        <option value="huge"></option>
                    </select>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <select className="ql-font">
                        <option ></option>
                        <option value="serif"></option>
                        <option value="monospace"></option>
                    </select>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button className="ql-bold" aria-label="Bold"></button>
                    <button className="ql-italic" aria-label="Italic"></button>
                    <button className="ql-underline" aria-label="Underline"></button>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button className="ql-script" value="sub"></button>
                    <button className="ql-script" value="super"></button>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <select className="ql-color"></select>
                    <select className="ql-background"></select>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button type="button" className="ql-list" value="ordered" aria-label="Ordered List"></button>
                    <button type="button" className="ql-list" value="bullet" aria-label="Unordered List"></button>
                    <select className="ql-align">
                        <option ></option>
                        <option value="center"></option>
                        <option value="right"></option>
                        <option value="justify"></option>
                    </select>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button className="ql-strike" aria-label="Strike"></button>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button type="button" className="ql-clean" aria-label="Remove Styles"></button>
                </span>
                <span className="ql-formats">
                    <button type="button" className="ql-source" aria-label="Source" onClick={() => setShowSource(!showSource)}>Source</button>
                </span>
                </>
            )
        } : {
            ref: fieldType !== FieldTypes.PASSWORD ? textRef : undefined,
            inputRef: fieldType === FieldTypes.PASSWORD ? textRef : undefined,
            id: isCellEditor ? undefined : props.name,
            className: getClassName(fieldType),
            style: { ...layoutStyle, ...textAlign, background: props.cellEditor_background_ },
            maxLength: length,
            disabled,
            autoFocus: props.autoFocus ? true : isCellEditor ? true : false,
            value: text || "",
            ariaLabel: props.ariaLabel,
            onChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setText(event.currentTarget.value),
            onBlur: () => {
                if (!escapePressed.current) {
                    onBlurCallback(baseProps, text, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, text, context.server), topbar))
                }
            },
            onKeyDown: (e:any) => fieldType === FieldTypes.TEXTFIELD ? tfOnKeyDown(e) : (fieldType === FieldTypes.TEXTAREA ? taOnKeyDown(e) : pwOnKeyDown(e))
        }
    }, [baseProps, context.server, fieldType, isCellEditor, layoutStyle, tfOnKeyDown, taOnKeyDown, pwOnKeyDown, 
        length, props.autoFocus, props.cellEditor_background_, props.cellEditor_editable_, 
        props.columnName, props.dataRow, props.id, props.name, text, textAlign, showSource]);

    /** Return either a textarea, password or normal textfield based on fieldtype */
    return (
        fieldType === FieldTypes.HTML ?
            <div 
                ref={textRef} 
                style={{ ...layoutStyle, background: props.cellEditor_background_ }} 
                id={isCellEditor ? undefined : props.name}
                aria-label={props.ariaLabel}
                className={[
                    getClassName(fieldType), 
                    disabled ? null : 'rc-editor-html--disabled'
                ].filter(Boolean).join(' ')} 
            >
                <Editor {...primeProps} />
                {showSource ? <InputTextarea
                    onChange={event => setText(event.currentTarget.value)}
                    value={ text || ""}  
                /> : null}
            </div>
            :
            fieldType === FieldTypes.TEXTAREA 
                ?
                <InputTextarea
                    {...primeProps}
                    autoResize={false} />
                :
                fieldType === FieldTypes.PASSWORD ?
                    <Password
                        {...primeProps}
                        feedback={false} />
                    :
                    <InputText
                        {...primeProps} />
    )
}
export default UIEditorText