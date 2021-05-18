/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';
import * as _ from 'underscore'

/** Hook imports */
import { useProperties, useRowSelect, useDataProviderData} from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { LayoutContext } from "../../../LayoutContext";
import { appContext } from "../../../AppProvider";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, sendSetValues, onBlurCallback} from "../../util";

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
    const linkedRef = useRef(null);
    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The data provided by the databook */
    const [providedData] = useDataProviderData(compId, props.cellEditor.linkReference.referencedDataBook||"");
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Current state of text value of input element */
    const [text, setText] = useState(selectedRow)
    /** For lazy loading, current state of the first value in lazy load "cache" */
    const [firstRow, setFirstRow] = useState(0);
    /** For lazy loading, current state of the last value in lazy loading "cache" */
    const [lastRow, setLastRow] = useState(100);
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
        if (linkedRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    //@ts-ignore
                    if (autoPanel.children[0].children[0]) {
                        //@ts-ignore
                        autoPanel.children[0].style.setProperty('--itemsHeight', Math.ceil(providedData.length * parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height))+'px');
                        if(!itemHeight.current) {
                            //@ts-ignore
                            itemHeight.current = parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height)
                        }
                    }
                }
            }, 150);
        }
    },[providedData, id]);

    /**
     * Sets the top style property of each dropdownitem based on the firstrow in cache (lazy loading)
     */
    useEffect(() => {
        if (linkedRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    let itemsList:Array<any> = [...document.getElementsByClassName("p-autocomplete-item")];
                    itemsList.map(element => element.style.setProperty('--itemTop', (parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height) * firstRow)+'px'));
                }
            }, 150)
        }
    }, [firstRow, lastRow])

    /**
     * Scrollevent, which manages the cache of the dropdownlist
     */
    useEffect(() => {
        const sendFetchRequest = () => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
        }
        const fetches = _.once(() => sendFetchRequest());
        const handleScroll = (elem:HTMLElement) => {
            if (elem) {
                elem.onscroll = _.debounce(() => {
                    let itemH = itemHeight.current ? itemHeight.current : 33
                    /** The current first item visible in the dropdownlist */
                    let currFirstItem = elem.scrollTop / itemH;
                    /** The current last item visible in the dropdownlist */
                    let currLastItem = (elem.scrollTop + elem.offsetHeight) / itemH;
                    /** If the current first item is "less" than the cached firstRow, set the new row states to reload the data */
                    if (currFirstItem < firstRow) {
                        setFirstRow(Math.floor(currFirstItem / 50) * 50);
                        setLastRow(Math.floor(currFirstItem / 50) * 50 + 100);
                        elem.scrollTop = itemH * (currLastItem - 3);
                    }
                    /** If the current last item is "greater" than the cached lastRow, set the new row states to reload the data */
                    if (currLastItem > lastRow) {
                        setFirstRow(Math.floor(currLastItem / 100) * 100);
                        setLastRow(Math.ceil(currLastItem / 100) * 100);
                        elem.scrollTop = itemH * (currFirstItem + 3)
                    }
                    /** If the current providedData length is smaller than the current first item + 400, send a fetchRequest to the server to fetch new data */
                    if (providedData.length < (currFirstItem+400) && !context.contentStore.dataProviderFetched.get(compId)?.get(props.cellEditor.linkReference.referencedDataBook || "")) {
                        fetches();
                    }
                }, 150);
            }
        }
        setTimeout(() => {
            handleScroll(document.getElementsByClassName("p-autocomplete-panel")[0] as HTMLElement)
        },150);
    }, [context.contentStore, context.server, props, providedData, firstRow, lastRow, compId])

    /**
     * When enter is pressed "submit" the value
     */
    useEffect(() => {
        if (linkedRef.current) {
            //@ts-ignore
            linkedInput.current.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                    handleInput();
                }
            }
        }
    });

    /** Returns the cached data based on first- and lastRow */
    const suggestionData = useMemo(() => {
        return providedData ? providedData.slice(firstRow, lastRow) : []
    }, [providedData, firstRow, lastRow])

    /**
     * Handles the input, when the text is entered manually or via the dropdown menu and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
    const handleInput = () => {
        const newVal:any = {}
        /** Returns the values, of the databook, that match the input of the user */
        const foundData = providedData.filter((data:any) => {
            if (props.cellEditor) {
                const refColNames = props.cellEditor.linkReference.referencedColumnNames
                const colNames = props.cellEditor.linkReference.columnNames
                const index = colNames.findIndex(col => col === props.columnName)
                return data[refColNames[index]].includes(text)
            }
            return false
        });
        /** If the text is empty, send null to the server */
        if (!text) {
            onBlurCallback(baseProps, null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, null, context.server));
        }
        /** If there is a match found send the value to the server */
        else if (foundData.length === 1) {                
            if (props.cellEditor) {
                if (props.cellEditor.linkReference.columnNames.length > 1) {
                    /** 
                     * Columnnames in linkReference and foundData are not the same they need to be properly set to be sent to the server
                     * Example: linkReference.columnNames = ACTI_ID, ACTI_ACADEMIC_TITLE
                     *          foundData = ID, ACADEMIC_TITLE
                     * foundData columnNames have to be adjusted to linkReference
                     */
                    for (let i = 0; i < Object.values(foundData[0]).length; i++)
                        newVal[props.cellEditor.linkReference.columnNames[i]] = Object.values(foundData[0])[i];                    
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, newVal, context.server));
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else
                    onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text, context.server));
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
                    const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                    text = value[props.cellEditor.linkReference.referencedColumnNames[colNameIndex]];
                } 
                suggestions.push(text)
            });
        }
        return suggestions
    }

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const onInputChange = (event:any) => {
        context.contentStore.clearDataFromProvider(compId, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = event.query;
        if (baseProps.id === "") {
            filterReq.columnNames = [baseProps.columnName]
        }
        context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }

    return (
        <AutoComplete
            ref={linkedRef}
            inputRef={linkedInput}
            autoFocus={props.autoFocus}
            appendTo={document.body}
            className="rc-editor-linked"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            scrollHeight={"200px"}
            inputStyle={{...textAlignment, background: props.cellEditor_background_, borderRight: "none"}}
            disabled={!props.cellEditor_editable_}
            dropdown
            completeMethod={onInputChange}
            suggestions={buildSuggestions(suggestionData)}
            value={text}
            onChange={event => {
                setText(event.target.value)
            }}
            onBlur={() => {
                /** On blur, close the dropdownmenu and set the cache to start */
                if (document.querySelector(".p-autocomplete-panel")) {
                    setFirstRow(0);
                    setLastRow(100)
                }
                handleInput();
            }}/>
    )
}
export default UIEditorLinked