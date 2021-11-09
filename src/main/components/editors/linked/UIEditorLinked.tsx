/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';

/** Hook imports */
import { useProperties, useRowSelect, useDataProviderData, useEventHandler, useLayoutValue, useFetchMissingData, useMouseListener, usePopupMenu, useMetaData} from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, sendSetValues, onBlurCallback, handleEnterKey, concatClassnames} from "../../util";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";
import { FetchResponse } from "../../../response";

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

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, props.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(compId, props.cellEditor.linkReference.referencedDataBook||"");

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Current state of text value of input element */
    const [text, setText] = useState(selectedRow);

    /** Extracting onLoadCallback and id from props */
    const {onLoadCallback, id} = props;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    const metaData = useMetaData(compId, props.cellEditor.linkReference.referencedDataBook||"");

    const tableOptions = props.cellEditor.columnView?.columnCount > 1;

    const focused = useRef<boolean>(false);

    const [initialFilter, setInitialFilter] = useState<boolean>(false);

    const [linkRefData, setLinkRefData] = useState<Map<string, any[]>|undefined>(context.contentStore.getDataBook(compId, props.cellEditor.linkReference.referencedDataBook)?.data);

    useFetchMissingData(props.parent as string, compId, props.dataRow);

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

        if (props.cellEditor.displayReferencedColumnName) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar)
            .then((results:FetchResponse[]) => {
                if (results[0].records) {
                    const tempMap = new Map<string, any[]>();
                    tempMap.set("current", results[0].records.map(record => {
                        const data:any = {}
                        results[0].columnNames.forEach((columnName, index) => {
                            data[columnName] = record[index];
                        });
                        return data;
                    }))
                    setLinkRefData(tempMap);
                }
            });
        }

        if (isCellEditor && props.passedKey) {
            setText("");
        }
    }, []);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useEffect(() => {
        if (props.cellEditor.displayReferencedColumnName && linkRefData && linkRefData.has("current")) {
            const foundObj = linkRefData.get("current")!.find(data => data[props.cellEditor.linkReference.referencedColumnNames[0]] === selectedRow);
            if (foundObj) {
                setText(foundObj[props.cellEditor.displayReferencedColumnName]);
            }
            else {
                setText(selectedRow);
            }
        }
        else {
            setText(selectedRow);
        }
        lastValue.current = selectedRow;
    }, [selectedRow, linkRefData]);

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
        context.contentStore.clearDataFromProvider(compId, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest();
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (isCellEditor) {
            filterReq.columnNames = [props.columnName]
        }
        await context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER).then(() => {
            if (!initialFilter) {
                setInitialFilter(true);
            }
        });
    }, [context.contentStore, context.server, props.cellEditor, props.name])

    useEffect(() => {
        setTimeout(() => {
            if(linkedRef.current && props.cellEditor.autoOpenPopup && ((props.cellEditor.preferredEditorMode === 1 || props.cellEditor.directCellEditor) && isCellEditor)) {
                sendFilter("");
                (linkedRef.current as any).showOverlay();
            }
        }, 33)

    }, [props.cellEditor.autoOpenPopup, props.cellEditor.directCellEditor, props.cellEditor.preferredEditorMode, isCellEditor, sendFilter]);

    useEffect(() => {
        if (focused.current && initialFilter && props.eventFocusGained) {
            //setTimeout 0ms so the transition is playing
            setTimeout(() => onFocusGained(props.name, context.server), 0);
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
        else if (isCellEditor && props.stopCellEditing) {
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
            onBlurCallback(props, null, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, null, context.server), topbar));
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
                    onBlurCallback(props, newVal[props.columnName], lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, newVal, context.server), topbar));
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else {
                    if (props.cellEditor.displayReferencedColumnName) {
                        onBlurCallback(props, foundData[0][linkReference.referencedColumnNames[0]], lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, foundData[0][linkReference.referencedColumnNames[0]], context.server), topbar));
                    }
                    else {
                        onBlurCallback(props, inputVal, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, inputVal, context.server), topbar));
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
        if (event.last >= providedData.length && !context.contentStore.getDataBook(compId, props.cellEditor.linkReference.referencedDataBook || "")?.allFetched) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            showTopBar(context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH), topbar)
        }
    }

    const itemTemplate = useCallback(d => {
        if(Array.isArray(d)) {
            return d.map((d, i) => <div key={i}>{d}</div>)
        } else {
            return d;
        }
    }, []);

    const groupedItemTemplate = useCallback(d => {
        return (d.label as string[]).map((d, i) => <div key={i}>{metaData?.columns.find(c => c.name === d)?.label ?? d}</div>)
    }, [metaData]);

    return (
        <span aria-label={props.ariaLabel} {...usePopupMenu(props)} style={layoutStyle}>
            <AutoComplete
                ref={linkedRef}
                id={!isCellEditor ? props.name : undefined}
                style={{ width: 'inherit' }}
                inputRef={linkedInput}
                autoFocus={props.autoFocus ? true : isCellEditor ? true : false}
                appendTo={document.body}
                className={"rc-editor-linked"}
                panelClassName={concatClassnames(
                    "dropdown-" + props.name, isCellEditor ? "dropdown-celleditor" : "", 
                    tableOptions ? "dropdown-table" : "",
                    linkedInput.current?.offsetWidth < 120 ? "linked-min-width" : ""
                )}
                scrollHeight={(providedData.length * 33) > 200 ? "200px" : `${providedData.length * 33}px`}
                inputStyle={{ ...textAlignment, background: props.cellEditor_background_, borderRight: "none" }}
                disabled={!props.cellEditor_editable_}
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
                                onFocusLost(props.name, context.server);
                            }
                            focused.current = false
                        }
                    }
                    else if (!linkedRef.current.container.contains(event.relatedTarget)) {
                        if (props.eventFocusLost) {
                            onFocusLost(props.name, context.server);
                        }
                        focused.current = false
                    }
                }}
                virtualScrollerOptions={{ itemSize: 33, lazy: true, onLazyLoad: handleLazyLoad, className: isCellEditor ? "celleditor-dropdown-virtual-scroller" : "dropdown-virtual-scroller" }}
                onSelect={(event) => handleInput(event.value)}
                tooltip={props.toolTipText}
                itemTemplate={itemTemplate}
                {...(tableOptions ? {
                    optionGroupLabel: "label",
                    optionGroupChildren: "items",
                    optionGroupTemplate: groupedItemTemplate
                } : {})}
            />
        </span>

    )
}
export default UIEditorLinked