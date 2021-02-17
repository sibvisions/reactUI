/** React imports */
import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';
import * as _ from 'underscore'

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import useDataProviderData from "../../zhooks/useDataProviderData";

/** Other imports */
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {createFetchRequest, createFilterRequest} from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {onBlurCallback} from "../../util/OnBlurCallback";
import {checkCellEditorAlignments} from "../../compprops/CheckAlignments";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseJVxSize} from "../../util/parseJVxSize";
import {getEditorCompId} from "../../util/GetEditorCompId";

/** Interface for cellEditor property of LinkedCellEditor */
interface ICellEditorLinked extends ICellEditor{
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
    preferredEditorMode?: number
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
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The data provided by the databook */
    const [providedData] = useDataProviderData(compId, baseProps.id, props.cellEditor.linkReference.referencedDataBook||"");
    /** The current state of the value for the selected row of the databook sent by the server */
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
    const [itemHeight, setItemHeight] = useState(0);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Alignments for CellEditor */
    const alignments = checkCellEditorAlignments(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && linkedRef.current){
            // @ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), linkedRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** Set inputfield style properties disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef:any = linkedRef.current
        if (autoRef) {
            autoRef.inputEl.style.setProperty('background', props.cellEditor_background_);
            autoRef.inputEl.style.setProperty('text-align', alignments.ha);
            autoRef.dropdownButton.element.tabIndex = -1;
        }
    },[props.cellEditor_editable_, props.cellEditor_background_, alignments.ha]);

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
                        autoPanel.children[0].style.height = Math.ceil(providedData.length * parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height))+'px';
                        if(itemHeight === 0) {
                            //@ts-ignore
                            setItemHeight(parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height))
                        }
                    }
                }
            }, 150);
        }
    },[providedData, id, itemHeight]);

    /**
     * Sets the top style property of each dropdownitem based on the firstrow in cache (lazy loading)
     */
    useEffect(() => {
        if (linkedRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    let itemsList:Array<any> = [...document.getElementsByClassName("p-autocomplete-item")];
                    itemsList.map(element => element.style.top = (parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height) * firstRow)+'px');
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
                    /** The current first item visible in the dropdownlist */
                    let currFirstItem = elem.scrollTop / itemHeight;
                    /** The current last item visible in the dropdownlist */
                    let currLastItem = (elem.scrollTop + elem.offsetHeight) / itemHeight;
                    /** If the current first item is "less" than the cached firstRow, set the new row states to reload the data */
                    if (currFirstItem < firstRow) {
                        setFirstRow(Math.floor(currFirstItem / 50) * 50);
                        setLastRow(Math.floor(currFirstItem / 50) * 50 + 100);
                        elem.scrollTop = itemHeight * (currLastItem - 3);
                    }
                    /** If the current last item is "greater" than the cached lastRow, set the new row states to reload the data */
                    if (currLastItem > lastRow) {
                        setFirstRow(Math.floor(currLastItem / 100) * 100);
                        setLastRow(Math.ceil(currLastItem / 100) * 100);
                        elem.scrollTop = itemHeight * (currFirstItem + 3)
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
    }, [context.contentStore, context.server, props, providedData, firstRow, lastRow, itemHeight, compId])

    /**
     * When enter is pressed "submit" the value
     */
    useEffect(() => {
        if (linkedRef.current) {
            //@ts-ignore
            linkedRef.current.inputEl.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
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
        const foundData = providedData.filter(data => {
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
            onBlurCallback(baseProps, null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, null, lastValue.current, context.server));
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
                    for (let i = 0; i < Object.values(foundData[0]).length; i++) {
                        console.log(props.cellEditor.linkReference.columnNames[i], Object.values(foundData[0])[i], foundData[0])
                        newVal[props.cellEditor.linkReference.columnNames[i]] = Object.values(foundData[0])[i];                    }
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, newVal, lastValue.current, context.server));
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else
                    onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text, lastValue.current, context.server));
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
                    if (props.cellEditor.columnView)
                        text = value[props.cellEditor.columnView.columnNames[0]]
                    else if (props.cellEditor.linkReference.referencedColumnNames.length > 1)
                        text = value[props.cellEditor.linkReference.referencedColumnNames[1]];
                    else
                        text = value[props.cellEditor.linkReference.referencedColumnNames[0]]
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
        context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }

    return (
        <AutoComplete
            autoFocus={props.autoFocus}
            appendTo={document.body}
            ref={linkedRef}
            className="rc-editor-linked"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
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
                    (document.querySelector(".p-autocomplete-dropdown") as HTMLElement).click()
                    setFirstRow(0);
                    setLastRow(100)
                }
                handleInput();
            }}/>
    )
}
export default UIEditorLinked