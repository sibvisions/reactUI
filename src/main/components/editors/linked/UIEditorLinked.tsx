/** React imports */
import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';
import tinycolor from "tinycolor2";

/** Hook imports */
import { useDataProviderData, useEventHandler, useMouseListener, usePopupMenu} from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { getTextAlignment } from "../../compprops";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, sendSetValues, handleEnterKey, concatClassnames} from "../../util";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";
//import { isSysColor, parseBackgroundString } from "../../compprops/ComponentProperties";

/** Interface for cellEditor property of LinkedCellEditor */
export interface ICellEditorLinked extends ICellEditor{
    linkReference: {
        referencedDataBook: string
        columnNames: string[]
        referencedColumnNames: string[]
    }
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>

    }
    clearColumns:Array<string>
    displayReferencedColumnName?:string
}

/** Interface for LinkedCellEditor */
export interface IEditorLinked extends IEditor{
    cellEditor: ICellEditorLinked
}

/**
 * This component displays an input field with a button which provides a dropdownlist with values of a databook
 * when text is entered into the inputfield, the dropdownlist gets filtered
 * @param props - Initial properties sent by the server for this component
 */
const UIEditorLinked: FC<IEditorLinked> = (props) => {
    /** Reference for the LinkedCellEditor element */
    const linkedRef = useRef<any>(null);

    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(props.screenName, props.cellEditor.linkReference.referencedDataBook||"");

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Current state of text value of input element */
    const [text, setText] = useState(props.selectedRow);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    const tableOptions = props.cellEditor.columnView?.columnCount > 1;

    const focused = useRef<boolean>(false);

    const [initialFilter, setInitialFilter] = useState<boolean>(false);

    /** Button background */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /** If the CellEditor is read-only */
    const isReadOnly = useMemo(() => (props.isCellEditor && props.readonly) || !props.cellEditor_editable_ || props.enabled === false, [props.isCellEditor, props.readonly, props.cellEditor_editable_, props.enabled]);

    /** Hook for MouseListener */
    useMouseListener(props.name, linkedRef.current ? linkedRef.current.container : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && linkedRef.current){
            sendOnLoadCallback(id, props.cellEditor.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), linkedRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef: any = linkedRef.current
        if (autoRef) {
            autoRef.dropdownButton.tabIndex = -1;
        }

        if (props.isCellEditor && props.passedKey) {
            setText("");
        }
    }, []);

    /** When props.selectedRow changes set the state of inputfield value to props.selectedRow and update lastValue reference */
    useEffect(() => {
        if (props.cellEditor.displayReferencedColumnName && providedData) {
            const foundObj = providedData.find((data:any) => data[props.cellEditor.linkReference.referencedColumnNames[0]] == props.selectedRow);
            if (foundObj) {
                setText(foundObj[props.cellEditor.displayReferencedColumnName]);
            }
            else {
                setText(props.selectedRow);
            }
        }
        else {
            setText(props.selectedRow);
        }
        lastValue.current = props.selectedRow;
    }, [props.selectedRow, providedData]);

    const unpackValue = (value: string | string[]) => {
        if (Array.isArray(value)) {
            const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
            const valIndex = props.cellEditor.columnView.columnNames.indexOf(props.cellEditor.linkReference.referencedColumnNames[colNameIndex]);
            return value[valIndex];
        } else {
            return value;
        }
    }

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const sendFilter = useCallback(async (value:any) => {
        props.context.contentStore.clearDataFromProvider(props.screenName, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest();
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (props.isCellEditor) {
            filterReq.columnNames = [props.columnName]
        }
        await props.context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER).then(() => {
            if (!initialFilter) {
                setInitialFilter(true);
            }
        });
    }, [props.context.contentStore, props.context.server, props.cellEditor, props.name])

    useEffect(() => {
        setTimeout(() => {
            if(linkedRef.current && props.cellEditor.autoOpenPopup && ((props.cellEditor.preferredEditorMode === 1 || props.cellEditor.directCellEditor) && props.isCellEditor)) {
                sendFilter("");
                (linkedRef.current as any).showOverlay();
            }
        }, 33)

    }, [props.cellEditor.autoOpenPopup, props.cellEditor.directCellEditor, props.cellEditor.preferredEditorMode, props.isCellEditor, sendFilter]);

    useEffect(() => {
        if (focused.current && initialFilter && props.eventFocusGained) {
            //setTimeout 0ms so the transition is playing
            setTimeout(() => onFocusGained(props.name, props.context.server), 0);
        }
    }, [initialFilter])

    /**
     * When enter is pressed "submit" the value
     */
    useEventHandler(linkedInput.current || undefined, "keydown", (event) => {
        event.stopPropagation();
        if((event as KeyboardEvent).key === "Enter") {
            (linkedRef.current as any).hideOverlay();
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
        }
        else if (props.isCellEditor && props.stopCellEditing) {
            if ((event as KeyboardEvent).key === "Tab") {
                (event.target as HTMLElement).blur()
                props.stopCellEditing(event);
            }
            else if ((event as KeyboardEvent).key === "Escape") {
                props.stopCellEditing(event)
            }
        }
    });

    /**
     * Handles the input, when the text is entered manually or via the dropdown menu and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
    const handleInput = (value?: string | string[]) => {
        const newVal:any = {}
        const linkReference = props.cellEditor.linkReference;

        let inputVal = value ? unpackValue(value) : text

        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);
    
        /** Returns the values, of the databook, that match the input of the user */
        let foundData = providedData.some((data: any) => data[refColNames[index]] === inputVal) ?
            providedData.find((data: any) => data[refColNames[index]] === inputVal) :
            providedData.filter((data: any) => {
                if (props.cellEditor) {
                    if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                        return data[props.cellEditor.displayReferencedColumnName].includes(inputVal);
                    }
                    else {
                        return data[refColNames[index]].includes(inputVal);
                    }

                }
                return false
            });

        foundData = Array.isArray(foundData) ? foundData : [foundData];

        const columnNames = (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1) ? props.columnName : linkReference.columnNames

        /** If the text is empty, send null to the server */
        if (!inputVal) {
            sendSetValues(props.dataRow, props.name, columnNames, null, props.context.server, lastValue.current, props.topbar);
        }
        /** If there is a match found send the value to the server */
        else if (foundData.length === 1) {                
            if (props.cellEditor) {
                if (linkReference.columnNames.length > 1) {
                    /** 
                     * Columnnames in linkReference and foundData are not the same they need to be properly set to be sent to the server
                     * Example: linkReference.columnNames = ACTI_ID, ACTI_ACADEMIC_TITLE
                     *          foundData = ID, ACADEMIC_TITLE
                     * foundData columnNames have to be adjusted to linkReference
                     */
                    linkReference.referencedColumnNames.forEach((refCol, i) => newVal[linkReference.columnNames[i]] = foundData[0][refCol])
                    if (newVal[props.columnName] === lastValue.current) {
                        setText(lastValue.current)
                    }
                    sendSetValues(props.dataRow, props.name, columnNames, newVal, props.context.server, lastValue.current, props.topbar);
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else {
                    if (props.cellEditor.displayReferencedColumnName) {
                        sendSetValues(props.dataRow, props.name, columnNames, foundData[0][linkReference.referencedColumnNames[0]], props.context.server, lastValue.current, props.topbar);
                    }
                    else {
                        sendSetValues(props.dataRow, props.name, columnNames, inputVal, props.context.server, lastValue.current, props.topbar);
                    }
                }
                    
            }
        
        }
        /** If there is no match found set the old value */
        else {
            setText(lastValue.current)
        }
    }

    /**
     * Returns the suggestions to display at the dropdownlist
     * @param values - The values which should be suggested
     * @returns the suggestions to display at the dropdownlist
     */
    const buildSuggestions = (values:any) => {
        let suggestions:any = []
        if (values.length > 0) {
            values.forEach((value:any) => {
                let text : string | string[] = ""
                if (props.cellEditor) {
                    if (props.cellEditor.displayReferencedColumnName) {
                        text = value[props.cellEditor.displayReferencedColumnName]
                    }
                    else if(props.cellEditor.columnView?.columnCount > 1) {
                        text = props.cellEditor.columnView.columnNames.map(c => value[c]);
                    }
                    else {
                        const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                        text = value[props.cellEditor.linkReference.referencedColumnNames[colNameIndex]];
                    }
                } 
                suggestions.push(text)
            });
        }

        if(props.cellEditor.columnView?.columnCount > 1) {
            return [{
                label: props.cellEditor.columnView.columnNames,
                items: suggestions
            }]
        } else {
            return suggestions
        }
    }

    const handleLazyLoad = (event:any) => {
        if (event.last >= providedData.length && !props.context.contentStore.getDataBook(props.screenName, props.cellEditor.linkReference.referencedDataBook || "")?.allFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            showTopBar(props.context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), props.topbar)
        }
    }

    const itemTemplate = useCallback(d => {
        if(Array.isArray(d)) {
            return d.map((d, i) => <div key={i}>{d}</div>)
        } else {
            return d;
        }
    }, [providedData]);

    const groupedItemTemplate = useCallback(d => {
        return (d.label as string[]).map((d, i) => <div key={i}>{props.columnMetaData?.label ?? d}</div>)
    }, [props.columnMetaData, providedData]);

    return (
        <span 
            aria-label={props.ariaLabel} 
            {...usePopupMenu(props)} 
            style={{
                ...props.layoutStyle
            } as CSSProperties}>
            <AutoComplete
                ref={linkedRef}
                id={!props.isCellEditor ? props.name : undefined}
                style={{ 
                    width: 'inherit',
                    height: 'inherit',
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                }}
                inputRef={linkedInput}
                autoFocus={props.autoFocus ? true : props.isCellEditor ? true : false}
                appendTo={document.body}
                className={concatClassnames(
                    "rc-editor-linked", 
                    props.columnMetaData?.nullable === false ? "required-field" : "",
                    props.isCellEditor ? "open-cell-editor" : undefined,
                )}
                panelClassName={concatClassnames(
                    "rc-editor-linked-dropdown",
                    "dropdown-" + props.name, props.isCellEditor ? "dropdown-celleditor" : "", 
                    tableOptions ? "dropdown-table" : "",
                    linkedInput.current?.offsetWidth < 120 ? "linked-min-width" : ""
                )}
                scrollHeight={tableOptions ? ((providedData.length + 1) * 38) > 200 ? "200px" : `${(providedData.length + 1) * 38}px` : (providedData.length * 38) > 200 ? "200px" : `${providedData.length * 38}px`}
                inputStyle={{
                    ...textAlignment, 
                    ...props.cellStyle,
                    borderRight: "none" 
                }}
                disabled={isReadOnly}
                dropdown
                completeMethod={event => sendFilter(event.query)}
                suggestions={buildSuggestions(providedData)}
                value={text}
                onChange={event => setText(unpackValue(event.target.value))}
                onFocus={() => {
                    if (!focused.current) {
                        focused.current = true
                    }
                }}
                onBlur={event => {
                    handleInput();
                    const dropDownElem = document.getElementsByClassName("dropdown-" + props.name)[0];
                    if (dropDownElem) {
                        if (!linkedRef.current.container.contains(event.relatedTarget) && !dropDownElem.contains(event.relatedTarget as Node)) {
                            if (props.eventFocusLost) {
                                onFocusLost(props.name, props.context.server);
                            }
                            focused.current = false
                        }
                    }
                    else if (!linkedRef.current.container.contains(event.relatedTarget)) {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, props.context.server);
                        }
                        focused.current = false
                    }
                }}
                virtualScrollerOptions={{ itemSize: 38, lazy: true, onLazyLoad: handleLazyLoad, className: props.isCellEditor ? "celleditor-dropdown-virtual-scroller" : "dropdown-virtual-scroller" }}
                onSelect={(event) => handleInput(event.value)}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                itemTemplate={itemTemplate}
                {...(tableOptions ? {
                    optionGroupLabel: "label",
                    optionGroupChildren: "items",
                    optionGroupTemplate: groupedItemTemplate
                } : {})}
                placeholder={props.cellEditor_placeholder_}
            />
        </span>

    )
}
export default UIEditorLinked