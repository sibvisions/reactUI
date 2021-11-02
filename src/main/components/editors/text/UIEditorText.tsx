/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";
import { Editor } from "primereact/editor";
import Quill from "quill";

/** Hook imports */
import { useEventHandler, useFetchMissingData, useLayoutValue, useMetaData, useMouseListener, usePopupMenu, useProperties, useRowSelect } from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId,
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
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

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

/** custom divider blot to insert <hr> intro quill editor */
let BlockEmbed = Quill.import('blots/block/embed');
class DividerBlot extends BlockEmbed { }
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';
Quill.register(DividerBlot);

const Module = Quill.import('core/module')
class DividerToolbar extends Module {
    constructor (quill: Quill, options: any) {
        super(quill, options)
        this.options = options
        this.quill = quill
        this.toolbar = quill.getModule('toolbar')
        this.toolbar.addHandler('divider', this.dividerHandler.bind(this))
    }

    dividerHandler () {
        const getSelection = this.quill.getSelection() || {}
        let selection = getSelection.index || this.quill.getLength()
        const [leaf] = this.quill.getLeaf(selection - 1)
        if (leaf instanceof DividerBlot) {
            this.quill.insertText(selection, '\n', "user")
            selection++
        }
        this.quill.insertEmbed(selection, 'divider', this.options, "user")
        if (getSelection.index === 0) {
            selection++
            this.quill.insertText(selection, '\n', "user")
        }
    }
}
Quill.register('modules/divider', DividerToolbar)

/**
 * DOM transforms:
 * <strong> -> <b>
 * <em> -> <i>
 * <p class="ql-align-center"> -> <p align="center">
 * <p class="ql-align-right"> -> <p align="right">
 * <p class="ql-align-justify"> -> <p align="justify">
 * <span class="ql-font-serif"> -> <font face="serif">
 * <span class="ql-size-huge"> -> <font size="7">
 * <span style="color: rgb(230, 0, 0);"> -> <font color="#ffff00">
 */

const namedSizes: Record<string, number> = {
    'small': 2,
    'large': 6,
    'huge': 7,
}

const fontFaces: Record<string, string> = {
    'monospace': 'monospaced',
    'serif': 'serif',
    'sans-serif': 'sans-serif',
}

function nameForSize(size: number) {
    return (Object.entries(namedSizes).find(e => e[1] === size) ?? [''])[0];
}

function fontForFace(face: String) {
    return (Object.entries(fontFaces).find(e => e[1] === face) ?? [''])[0];
}

function transformHTMLFromQuill(html: string = ''):string {
    if(!html) { return html }
    html = html.replace(/<(\/ *)?strong>/g, (m, a = '') => `<${a}b>`);
    html = html.replace(/<(\/ *)?em>/g, (m, a = '') => `<${a}i>`);
    html = html.replace(/<p class="ql-align-([a-z]+)">/g, (m, a) => `<p align="${a}">`);
    
    const parser = new DOMParser();
    const d = parser.parseFromString(html, "text/html");

    let span: HTMLElement | null;
    while (span = d.querySelector('span:not([skip])')) {
        const font = span.className.match(/ql-font-([a-z\-]+)/);
        const size = span.className.match(/ql-size-([a-z\-]+)/);
        const color = span.style.color;

        const f = d.createElement('font');
        if(font) {
            f.setAttribute('face', fontFaces[font[1]]);
        }
        if(size) {
            f.setAttribute('size', namedSizes[size[1]].toString());
        }
        if(color) {
            f.setAttribute('color', color);
        }

        f.innerHTML = span.innerHTML;

        span.parentElement?.insertBefore(f, span);
        span.remove();
    }

    html = d.body.innerHTML;

    return html;
}

function transformHTMLToQuill(html: string = ''):string {
    if(!html) { return html }
    html = html.replace(/<(\/ *)?b>/g, (m, a = '') => `<${a}strong>`);
    html = html.replace(/<(\/ *)?i>/g, (m, a = '') => `<${a}em>`);
    html = html.replace(/<p align="([a-z]+)">/g, (m, a) => `<p class="ql-align-${a}">`);

    const parser = new DOMParser();
    const d = parser.parseFromString(html, "text/html");

    let font: HTMLElement | null;
    while (font = d.querySelector('font')) {
        const face = font.getAttribute('face');
        const size = font.getAttribute('size');
        const color = font.getAttribute("color");

        const s = d.createElement('span');
        if(face) {
            s.classList.add(`ql-font-${fontForFace(face)}`)
        }
        if(size) {
            s.classList.add(`ql-size-${nameForSize(parseInt(size))}`)
        }
        if(color) {
            s.style.color = color;
        }

        s.innerHTML = font.innerHTML;

        font.parentElement?.insertBefore(s, font);
        font.remove();
    }

    html = d.body.innerHTML;


    return html;
}

/**
 * TextCellEditor is an inputfield which allows to enter text. Based on the contentType the server sends it is decided wether
 * the CellEditor becomes a normal texteditor, a textarea or a passwor field, when the value is changed the databook on the server is changed
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorText: FC<IEditorText> = (props) => {
    /** Reference for the TextCellEditor element */
    const textRef = useRef<any>();

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, props.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Current state value of input element */
    const [text, setText] = useState(selectedRow);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id, name, stopCellEditing, dataRow, columnName} = props;

    /** The metaData of the dataRow */
    const metaData = useMetaData(compId, props.dataRow)

    /** The cell-editor of the TextCellEditor */
    const cellEditorMetaData:LengthBasedColumnDescription = useMemo(() => getColMetaData(props.columnName, metaData) as LengthBasedColumnDescription, [metaData]);

    /** Returns the maximum length for the TextCellEditor */
    const length = useMemo(() => cellEditorMetaData?.length, [cellEditorMetaData]);

    /** The horizontal- and vertical alignments */
    const textAlign = useMemo(() => getTextAlignment(props), [props]);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    /** Reference if escape has been pressed */
    const escapePressed = useRef<boolean>(false)

    const [showSource, setShowSource] = useState<boolean>(false);

    useFetchMissingData(props.parent as string, props.dataRow);

    const popupMenu = usePopupMenu(props);

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
        if(onLoadCallback && textRef.current && fieldType !== FieldTypes.HTML) {
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), textRef.current, onLoadCallback);
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
                onBlurCallback(props, text, lastValue.current, () => showTopBar(sendSetValues(dataRow, name, columnName, text, context.server), topbar));
                stopCellEditing(event);
            }
            else if (event.key === "Escape") {
                escapePressed.current = true;
                stopCellEditing(event);
            }
        }
    }, [props, stopCellEditing, dataRow, columnName, name, text, isCellEditor, context.server]);

    const disabled = !props.cellEditor_editable_;

    const primeProps: any = useMemo(() => {
        return fieldType === FieldTypes.HTML ? {
            onLoad: () => {
                if (textRef.current && onLoadCallback) {
                    sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), textRef.current, onLoadCallback)
                }
            },
            onTextChange: showSource || disabled ? () => {} : (value: any) => setText(transformHTMLFromQuill(value.htmlValue)),
            value: transformHTMLToQuill(text) || "",
            formats: ["bold", "color", "font", "background", "italic", "underline", "size", "strike", "align", "list", "script", "divider"],
            modules: {
                divider: true,
                clipboard: true,
                keyboard: true,
                history: true,
            },
            headerTemplate: (
                <>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <select className="ql-size" defaultValue="">
                        <option value="small"></option>
                        <option ></option>
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
                    <button className="ql-divider" aria-label="Divider">
                        <svg width="18" height="18" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <rect className="ql-fill" x="0" y="45" width="100" height="10" />
                        </svg>
                    </button>
                </span>
                <span className={`ql-formats ${showSource ? 'ql-formats--disabled' : ''}`}>
                    <button type="button" className="ql-clean" aria-label="Remove Styles"></button>
                </span>
                <span className="ql-formats">
                    <button type="button" className="ql-source" aria-label="Source" onClick={() => setShowSource(!showSource)}>
                        <svg width="18" height="18" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path className="ql-fill" d="M58.059,14.795C55.938,14.23 53.676,15.502 53.11,17.764L36.71,80.254C36.145,82.375 37.417,84.637 39.679,85.202C39.962,85.344 40.386,85.344 40.669,85.344C42.507,85.344 44.203,84.071 44.628,82.233L61.028,19.602C61.593,17.482 60.321,15.361 58.059,14.795ZM30.49,26.247C28.934,24.692 26.248,24.692 24.693,26.247L3.91,47.171C2.355,48.726 2.355,51.413 3.91,52.968L24.552,73.892C25.4,74.74 26.39,75.164 27.521,75.164C28.51,75.164 29.641,74.74 30.348,74.033C31.903,72.478 31.903,69.792 30.348,68.237L12.676,49.999L30.49,32.044C32.045,30.347 32.045,27.802 30.49,26.247ZM96.09,47.171L75.307,26.247C73.752,24.692 71.066,24.692 69.51,26.247C67.955,27.802 67.955,30.488 69.51,32.044L87.324,49.999L69.51,67.954C67.955,69.509 67.955,72.196 69.51,73.751C70.359,74.599 71.348,74.882 72.338,74.882C73.328,74.882 74.459,74.458 75.307,73.609L96.09,52.826C97.645,51.271 97.645,48.726 96.09,47.171Z" />
                        </svg>
                    </button>
                </span>
                </>
            )
        } : {
            ...(fieldType === FieldTypes.PASSWORD ? { inputRef: textRef } : { ref: textRef }),
            id: isCellEditor ? undefined : props.name,
            className: getClassName(fieldType),
            style: { ...layoutStyle, ...textAlign, background: props.cellEditor_background_ },
            maxLength: length,
            disabled,
            autoFocus: props.autoFocus ? true : isCellEditor ? true : false,
            value: text || "",
            "aria-label": props.ariaLabel,
            onChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setText(event.currentTarget.value),
            onFocus: props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined,
            onBlur: () => {
                if (!escapePressed.current) {
                    onBlurCallback(props, text, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, text, context.server), topbar))
                }
                if (props.eventFocusLost) {
                    showTopBar(onFocusLost(props.name, context.server), topbar)
                }
            },
            onKeyDown: (e:any) => fieldType === FieldTypes.TEXTFIELD ? tfOnKeyDown(e) : (fieldType === FieldTypes.TEXTAREA ? taOnKeyDown(e) : pwOnKeyDown(e)),
            tooltip: props.toolTipText
        }
    }, [props, context.server, fieldType, isCellEditor, layoutStyle, tfOnKeyDown, taOnKeyDown, pwOnKeyDown, 
        length, props.autoFocus, props.cellEditor_background_, disabled, 
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
                    disabled ? 'rc-editor-html--disabled' : null
                ].filter(Boolean).join(' ')}
                tabIndex={props.tabIndex ? props.tabIndex : 0}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={() => {
                    if (!escapePressed.current) {
                        onBlurCallback(props, text, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, props.columnName, text, context.server), topbar))
                    }
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, context.server)
                    }
                }}
                {...popupMenu}
            >
                <Editor {...primeProps} />
                {showSource ? <InputTextarea
                    onChange={event => setText(event.currentTarget.value)}
                    value={ text || "" }  
                /> : null}
            </div>
            :
            fieldType === FieldTypes.TEXTAREA 
                ?
                <InputTextarea
                    {...primeProps}
                    {...popupMenu}
                    autoResize={false}
                    cols={18}
                    rows={4} />
                :
                fieldType === FieldTypes.PASSWORD ?
                    <Password
                        {...primeProps}
                        {...popupMenu}
                        feedback={false}
                        size={15} />
                    :
                    <InputText
                        {...primeProps}
                        {...popupMenu}
                        size={15} />
    )
}
export default UIEditorText