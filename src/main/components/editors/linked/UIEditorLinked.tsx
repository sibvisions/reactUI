/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';
import * as _ from 'underscore'

/** Hook imports */
import { useProperties, useRowSelect, useDataProviderData, useEventHandler} from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, sendSetValues, onBlurCallback, getMetaData, handleEnterKey} from "../../util";

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
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorLinked: FC<IEditorLinked> = (baseProps) => {
    /** Reference for the LinkedCellEditor element */
    const linkedRef = useRef<any>(null);
    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);
    /** The data provided by the databook */
    const [providedData] = useDataProviderData(compId, props.cellEditor.linkReference.referencedDataBook||"");
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Current state of text value of input element */
    const [text, setText] = useState(selectedRow)
    /** For lazy loading, current state of the data window lazy load "cache" */
    const [lazyWindow, setLazyWindow] = useState([0, 100]);
    /** Current state of the height of an item in the LinkedCellEditor list, used for calculating position in lazy loading*/
    const itemHeight = useRef<number>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && linkedRef.current){
            // @ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), linkedRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef:any = linkedRef.current
        if (autoRef) {
            autoRef.dropdownButton.tabIndex = -1;
        }
    },[]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    }, [selectedRow])

    /** 
     * Sets the height for the dropdownlist based on the amount of providedData, 
     * and sets the state of itemHeight as the height of an item of the dropdownlist
     * SetTimeout is required because the autocomplete panel can't be found if there is no timeout 
     */
    useEffect(() => {
        const elem = linkedRef.current?.overlayRef?.current as HTMLElement;
        if (elem) {
            if (elem.children[0].children[0]) {
                if(!itemHeight.current) {
                    itemHeight.current = parseFloat(window.getComputedStyle(elem.children[0].children[0]).height)
                }
                elem.style.setProperty('--itemsHeight', Math.ceil(providedData.length * itemHeight.current) + 'px');
            }
        }
    }, [providedData]);

    /**
     * Sets the top style property of each dropdownitem based on the firstrow in cache (lazy loading)
     */
    useEffect(() => {
        const elem = linkedRef.current?.overlayRef?.current as HTMLElement;
        if (elem) {
            elem.style.setProperty('--itemTop', parseFloat(window.getComputedStyle(elem.children[0].children[0]).height) * lazyWindow[0] + 'px');
        }
    }, [lazyWindow])


    const handleScroll = useRef<Function>();
    useEffect(() => {
        const sendFetchRequest = _.once(() => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
        })
        let ignoreNextScroll = false;
        let internalLazyWindow = lazyWindow;
        handleScroll.current = _.debounce((elem:HTMLElement) => {
            if (ignoreNextScroll) {
                ignoreNextScroll = false;
                return;
            }
            
            const scroll = elem.scrollTop;
            let itemH = itemHeight.current ? itemHeight.current : 33
            /** The current first item visible in the dropdownlist */
            let currFirstItem = scroll / itemH;
            /** The current last item visible in the dropdownlist */
            let currLastItem = (scroll + elem.offsetHeight) / itemH;
            
            /** If the current first item is "less" than the cached firstRow, set the new row states to reload the data */
            if (currFirstItem < lazyWindow[0]) {
                internalLazyWindow = [
                    Math.floor(currFirstItem / 50) * 50,
                    Math.floor(currFirstItem / 50) * 50 + 100
                ]
                setLazyWindow(internalLazyWindow);
                ignoreNextScroll = true;
                elem.scrollTop = scroll;
            }
            /** If the current last item is "greater" than the cached lastRow, set the new row states to reload the data */
            if (currLastItem > lazyWindow[1]) {
                internalLazyWindow = [
                    Math.floor(currLastItem / 50) * 50 - 50,
                    Math.floor(currLastItem / 50) * 50 + 50
                ]
                setLazyWindow(internalLazyWindow);
                ignoreNextScroll = true;
                elem.scrollTop = scroll;
            }
            /** If the current providedData length is smaller than the current first item + 400, send a fetchRequest to the server to fetch new data */
            if (
                providedData.length < currFirstItem + 400 && 
                !context.contentStore.dataProviderFetched.get(compId)?.get(props.cellEditor.linkReference.referencedDataBook || "")
            ) {
                sendFetchRequest()
            }
        }, 150);
    }, [context.contentStore, lazyWindow, compId, context.server, providedData.length, props.cellEditor.linkReference.referencedDataBook])

    /**
     * Scrollevent, which manages the cache of the dropdownlist
     */
    const handleShow = useCallback(() => {
        const elem = linkedRef.current?.overlayRef?.current as HTMLElement;
        if (elem) {
            handleScroll.current && handleScroll.current(elem);
            elem.onscroll = () => {
                handleScroll.current && handleScroll.current(elem)
            };

            if (elem.children[0].children[0]) {
                if(!itemHeight.current) {
                    itemHeight.current = parseFloat(window.getComputedStyle(elem.children[0].children[0]).height)
                }
                elem.style.setProperty('--itemsHeight', Math.ceil(providedData.length * itemHeight.current) + 'px');
            }
        }
    }, [providedData.length]);

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const sendFilter = useCallback(async (value:any) => {
        context.contentStore.clearDataFromProvider(compId, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (props.stopCellEditing) {
            filterReq.columnNames = [baseProps.columnName]
        }
        await context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }, [context.contentStore, context.server, props.cellEditor, props.name])

    useEffect(() => {
        if(linkedRef.current && props.cellEditor.autoOpenPopup && ((props.cellEditor.preferredEditorMode === 1 || props.cellEditor.directCellEditor) && props.stopCellEditing)) {
            sendFilter("")
            setTimeout(() => (linkedRef.current as any).showOverlay(), 33);
        }
    }, [props.cellEditor.autoOpenPopup, props.cellEditor.directCellEditor, props.cellEditor.preferredEditorMode, props.stopCellEditing, sendFilter])

    /**
     * When enter is pressed "submit" the value
     */
    useEventHandler(linkedInput.current || undefined, "keydown", (event) => {
        event.stopPropagation();
        if((event as KeyboardEvent).key === "Enter") {
            (linkedRef.current as any).hideOverlay();
            handleInput();
            handleEnterKey(event, event.target, props.stopCellEditing)
        }
    })

    /** Returns the cached data based on first- and lastRow */
    const suggestionData = useMemo(() => {
        return providedData ? providedData.slice(lazyWindow[0], lazyWindow[1]) : []
    }, [providedData, lazyWindow])

    /**
     * Handles the input, when the text is entered manually or via the dropdown menu and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
    const handleInput = () => {
        const newVal:any = {}
        const linkReference = props.cellEditor.linkReference
        /** Returns the values, of the databook, that match the input of the user */
        const foundData = providedData.filter((data:any) => {
            if (props.cellEditor) {
                if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                    return data[props.cellEditor.displayReferencedColumnName].includes(text);
                }
                else {
                    const refColNames = linkReference.referencedColumnNames;
                    const colNames = linkReference.columnNames;
                    const index = colNames.findIndex(col => col === props.columnName);
                    return data[refColNames[index]].includes(text);
                }

            }
            return false
        });

        const columnNames = (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1) ? props.columnName : linkReference.columnNames

        /** If the text is empty, send null to the server */
        if (!text) {
            onBlurCallback(baseProps, null, lastValue.current, () => sendSetValues(props.dataRow, props.name, columnNames, null, context.server));
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
                    for (let i = 0; i < Object.values(foundData[0]).length; i++) {
                        newVal[linkReference.columnNames[i]] = Object.values(foundData[0])[i]; 
                    }
                                           
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => sendSetValues(props.dataRow, props.name, columnNames, newVal, context.server));
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else {
                    onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, columnNames, text, context.server));
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
                let text = ""
                if (props.cellEditor) {
                    if (props.cellEditor.displayReferencedColumnName) {
                        text = value[props.cellEditor.displayReferencedColumnName]
                    }
                    else {
                        const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                        text = value[props.cellEditor.linkReference.referencedColumnNames[colNameIndex]];
                    }

                } 
                suggestions.push(text)
            });
        }
        return suggestions
    }

    return (
        <AutoComplete
            ref={linkedRef}
            inputRef={linkedInput}
            autoFocus={props.autoFocus ? true : props.stopCellEditing ? true : false}
            appendTo={document.body}
            className="rc-editor-linked"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            scrollHeight={"200px"}
            inputStyle={{...textAlignment, background: props.cellEditor_background_, borderRight: "none"}}
            disabled={!props.cellEditor_editable_}
            dropdown
            completeMethod={(event) => sendFilter(event.query)}
            suggestions={buildSuggestions(suggestionData)}
            value={text}
            onShow={handleShow}
            onChange={event => {
                setText(event.target.value)
            }}
            onBlur={() => {
                /** On blur, close the dropdownmenu and set the cache to start */
                if (document.querySelector(".p-autocomplete-panel")) {
                    setLazyWindow([0, 100]);
                }
                handleInput();
            }}/>
    )
}
export default UIEditorLinked